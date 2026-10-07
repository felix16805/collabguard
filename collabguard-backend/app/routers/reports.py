"""Collusion audit reports and pairwise diff router."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from app.db.mongodb import mongodb
from app.schemas.graph import SimilarityPairDetail

router = APIRouter(prefix="/reports", tags=["Reports & Audits"])


@router.get("/{batch_id}", response_model=dict)
async def get_batch_report(batch_id: str):
    """
    Generate comprehensive collusion report for a batch,
    including detected clusters, high-risk pairs, and graph metrics.
    """
    batch = None
    if mongodb.is_connected and mongodb.db is not None:
        batch = await mongodb.db.batches.find_one({"batch_id": batch_id})
        if batch:
            batch["_id"] = str(batch["_id"])
    if not batch:
        batch = mongodb._mock_data["batches"].get(batch_id)

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    flagged_pairs = []
    if mongodb.is_connected and mongodb.db is not None:
        cursor = mongodb.db.similarity_pairs.find({"batch_id": batch_id}).sort("score", -1)
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            flagged_pairs.append(doc)
    else:
        flagged_pairs = mongodb._mock_data["similarity_pairs"].get(batch_id, [])

    clusters = mongodb._mock_data["clusters"].get(batch_id, [])

    return {
        "report_id": f"rep_{batch_id}",
        "academic_course": "BCSE406L — NoSQL Databases",
        "batch_id": batch_id,
        "summary": batch,
        "clusters": clusters,
        "flagged_pairs": flagged_pairs,
        "audit_metadata": {
            "evaluation_engine": "CollabGuard v0.1.0 (AST Tokenizer + Winnowing + Neo4j Louvain)",
            "institution": "Vellore Institute of Technology",
            "guide": "Dr. D. Vivek",
            "author": "Dipanjan Das (felix16805)",
        },
    }


@router.get("/{batch_id}/pair/{sub1_id}/{sub2_id}", response_model=SimilarityPairDetail)
async def get_pair_diff(batch_id: str, sub1_id: str, sub2_id: str):
    """
    Retrieve side-by-side code diff and highlighted token intervals for two submissions.
    """
    pair = None
    if mongodb.is_connected and mongodb.db is not None:
        pair = await mongodb.db.similarity_pairs.find_one({
            "batch_id": batch_id,
            "$or": [
                {"sub1_id": sub1_id, "sub2_id": sub2_id},
                {"sub1_id": sub2_id, "sub2_id": sub1_id},
            ],
        })
        if pair:
            pair["_id"] = str(pair["_id"])

    if not pair:
        pairs_list = mongodb._mock_data["similarity_pairs"].get(batch_id, [])
        for p in pairs_list:
            if (p["sub1_id"] == sub1_id and p["sub2_id"] == sub2_id) or (
                p["sub1_id"] == sub2_id and p["sub2_id"] == sub1_id
            ):
                pair = p
                break

    if not pair:
        raise HTTPException(status_code=404, detail="Pair comparison not found in batch")

    # Fetch raw codes from MongoDB if available
    code1 = ""
    code2 = ""
    if mongodb.is_connected and mongodb.db is not None:
        s1 = await mongodb.db.submissions.find_one({"id": sub1_id})
        s2 = await mongodb.db.submissions.find_one({"id": sub2_id})
        if s1:
            code1 = s1.get("code", "")
        if s2:
            code2 = s2.get("code", "")

    return SimilarityPairDetail(
        batch_id=batch_id,
        sub1_id=pair["sub1_id"],
        sub2_id=pair["sub2_id"],
        student1_id=pair["student1_id"],
        student2_id=pair["student2_id"],
        student1_name=pair["student1_name"],
        student2_name=pair["student2_name"],
        filename1=pair["filename1"],
        filename2=pair["filename2"],
        score=pair["score"],
        jaccard=pair["jaccard"],
        containment=pair["containment"],
        shared_kgrams=pair["shared_kgrams"],
        matched_intervals_1=pair.get("matched_intervals_1", []),
        matched_intervals_2=pair.get("matched_intervals_2", []),
        code1=code1 or "# Code 1 loaded from archive",
        code2=code2 or "# Code 2 loaded from archive",
    )
