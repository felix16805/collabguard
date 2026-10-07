"""Submissions and batch management router."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.db.mongodb import mongodb
from app.engine.pipeline import run_analysis_pipeline
from app.schemas.submissions import BatchUploadRequest, BatchSummary

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("/batch", response_model=dict)
async def upload_batch(payload: BatchUploadRequest):
    """
    Ingest a batch of Python code submissions and automatically run the
    AST Winnowing & Neo4j graph pipeline.
    """
    batch_id = f"batch_{uuid.uuid4().hex[:8]}"

    submissions_raw = [
        {
            "id": item.id or f"sub_{uuid.uuid4().hex[:6]}",
            "student_id": item.student_id,
            "student_name": item.student_name,
            "reg_no": item.reg_no,
            "filename": item.filename,
            "code": item.code,
        }
        for item in payload.submissions
    ]

    result = await run_analysis_pipeline(
        batch_id=batch_id,
        assignment_id=payload.assignment_id,
        submissions_raw=submissions_raw,
        similarity_threshold=payload.similarity_threshold,
    )

    return {
        "message": "Batch processed successfully",
        "batch_id": batch_id,
        "summary": result["batch"],
        "flagged_pairs_count": len(result["flagged_pairs"]),
        "clusters_count": len(result["clusters"]),
    }


@router.get("/batches", response_model=List[dict])
async def list_batches():
    """List all analyzed batches."""
    batches = []
    if mongodb.is_connected and mongodb.db is not None:
        cursor = mongodb.db.batches.find().sort("processed_at", -1)
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            batches.append(doc)
    else:
        batches = list(mongodb._mock_data["batches"].values())

    return batches


@router.get("/batch/{batch_id}", response_model=dict)
async def get_batch_details(batch_id: str):
    """Get details and submission list for a specific batch."""
    batch = None
    if mongodb.is_connected and mongodb.db is not None:
        batch = await mongodb.db.batches.find_one({"batch_id": batch_id})
        if batch:
            batch["_id"] = str(batch["_id"])
    if not batch:
        batch = mongodb._mock_data["batches"].get(batch_id)

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    submissions = []
    if mongodb.is_connected and mongodb.db is not None:
        cursor = mongodb.db.submissions.find({"batch_id": batch_id}, {"code": 0})
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            submissions.append(doc)

    return {
        "batch": batch,
        "submissions": submissions,
    }
