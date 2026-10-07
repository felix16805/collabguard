"""End-to-end processing pipeline orchestrating AST tokenization, Winnowing, and Neo4j graph sync."""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List
from app.core.config import settings
from app.db.mongodb import mongodb
from app.db.neo4j import neo4j_manager
from app.engine.tokenizer import tokenize_python_code
from app.engine.winnowing import compute_winnowing_fingerprints, calculate_similarity

logger = logging.getLogger("collabguard.pipeline")


async def run_analysis_pipeline(
    batch_id: str,
    assignment_id: str,
    submissions_raw: List[Dict[str, Any]],
    similarity_threshold: float = settings.SIMILARITY_THRESHOLD,
) -> Dict[str, Any]:
    """
    Execute full analysis pipeline:
    1. Parse AST & extract tokens
    2. Compute Winnowing fingerprints
    3. Pairwise comparison
    4. Sync to Neo4j & run Louvain clustering
    5. Save results to MongoDB
    """
    logger.info(f"Starting analysis pipeline for batch {batch_id} with {len(submissions_raw)} submissions.")

    # 1. Tokenize and compute fingerprints
    processed_submissions = []
    student_map = {}

    for item in submissions_raw:
        sub_id = item["id"]
        student_id = item["student_id"]
        student_name = item.get("student_name", f"Student {student_id}")
        reg_no = item.get("reg_no", student_id)
        code = item["code"]
        filename = item.get("filename", f"{sub_id}.py")

        student_map[student_id] = {
            "student_id": student_id,
            "name": student_name,
            "reg_no": reg_no,
        }

        tokens = tokenize_python_code(code)
        fingerprints = compute_winnowing_fingerprints(
            tokens,
            k=settings.WINNOWING_K_GRAM,
            t=settings.WINNOWING_WINDOW_SIZE,
        )

        sub_record = {
            "id": sub_id,
            "student_id": student_id,
            "assignment_id": assignment_id,
            "batch_id": batch_id,
            "filename": filename,
            "code": code,
            "token_count": len(tokens),
            "fingerprint_count": len(fingerprints),
            "fingerprints": [
                {
                    "hash": fp.hash_value,
                    "start": fp.start_line,
                    "end": fp.end_line,
                    "idx": fp.token_index,
                }
                for fp in fingerprints
            ],
            "_raw_fps": fingerprints,
        }
        processed_submissions.append(sub_record)

    # 2. Pairwise comparison
    flagged_pairs = []
    n = len(processed_submissions)
    for i in range(n):
        for j in range(i + 1, n):
            sub1 = processed_submissions[i]
            sub2 = processed_submissions[j]

            # Compare fingerprints
            metrics = calculate_similarity(sub1["_raw_fps"], sub2["_raw_fps"])

            if metrics["score"] >= similarity_threshold:
                pair_record = {
                    "batch_id": batch_id,
                    "assignment_id": assignment_id,
                    "sub1_id": sub1["id"],
                    "sub2_id": sub2["id"],
                    "student1_id": sub1["student_id"],
                    "student2_id": sub2["student_id"],
                    "student1_name": student_map[sub1["student_id"]]["name"],
                    "student2_name": student_map[sub2["student_id"]]["name"],
                    "filename1": sub1["filename"],
                    "filename2": sub2["filename"],
                    "score": metrics["score"],
                    "jaccard": metrics["jaccard"],
                    "containment": metrics["containment"],
                    "shared_kgrams": metrics["shared_count"],
                    "matched_intervals_1": metrics["matched_intervals_1"],
                    "matched_intervals_2": metrics["matched_intervals_2"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                flagged_pairs.append(pair_record)

    # Sort flagged pairs by score descending
    flagged_pairs.sort(key=lambda x: x["score"], reverse=True)

    # 3. Synchronize to Neo4j graph and execute Louvain clustering
    students_list = list(student_map.values())
    await neo4j_manager.sync_batch_graph(
        batch_id=batch_id,
        students=students_list,
        submissions=processed_submissions,
        similarity_edges=flagged_pairs,
    )

    cluster_map = await neo4j_manager.detect_louvain_communities(batch_id)

    # Group clusters
    clusters_dict: Dict[int, List[str]] = {}
    for st_id, cluster_id in cluster_map.items():
        if cluster_id not in clusters_dict:
            clusters_dict[cluster_id] = []
        clusters_dict[cluster_id].append(st_id)

    clusters_summary = []
    for c_id, members in clusters_dict.items():
        if len(members) > 1:  # Only collusion rings of 2 or more students
            # Compute average pairwise score within cluster
            member_pairs = [
                p for p in flagged_pairs
                if p["student1_id"] in members and p["student2_id"] in members
            ]
            avg_score = (
                sum(p["score"] for p in member_pairs) / len(member_pairs)
                if member_pairs
                else 0.0
            )
            clusters_summary.append({
                "cluster_id": c_id,
                "size": len(members),
                "members": members,
                "member_names": [student_map[m]["name"] for m in members if m in student_map],
                "average_similarity": round(avg_score, 4),
                "pair_count": len(member_pairs),
            })

    # 4. Save to MongoDB & in-memory cache
    batch_summary = {
        "batch_id": batch_id,
        "assignment_id": assignment_id,
        "total_submissions": len(processed_submissions),
        "total_students": len(students_list),
        "flagged_pairs_count": len(flagged_pairs),
        "clusters_count": len(clusters_summary),
        "status": "COMPLETED",
        "threshold": similarity_threshold,
        "highest_similarity": flagged_pairs[0]["score"] if flagged_pairs else 0.0,
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }

    # Persist in MongoDB if online
    if mongodb.is_connected and mongodb.db is not None:
        try:
            # Clean stripped field before storing
            subs_to_insert = []
            for s in processed_submissions:
                s_copy = dict(s)
                del s_copy["_raw_fps"]
                subs_to_insert.append(s_copy)

            await mongodb.db.submissions.delete_many({"batch_id": batch_id})
            if subs_to_insert:
                await mongodb.db.submissions.insert_many(subs_to_insert)

            await mongodb.db.similarity_pairs.delete_many({"batch_id": batch_id})
            if flagged_pairs:
                await mongodb.db.similarity_pairs.insert_many(flagged_pairs)

            await mongodb.db.batches.update_one(
                {"batch_id": batch_id},
                {"$set": batch_summary},
                upsert=True,
            )
            logger.info("Batch results saved to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to persist batch in MongoDB: {e}")

    # Also record in in-memory fallback
    mongodb._mock_data["batches"][batch_id] = batch_summary
    mongodb._mock_data["similarity_pairs"][batch_id] = flagged_pairs
    mongodb._mock_data["clusters"][batch_id] = clusters_summary

    return {
        "batch": batch_summary,
        "flagged_pairs": flagged_pairs,
        "clusters": clusters_summary,
    }
