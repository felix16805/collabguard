"""Dedicated NoSQL Router: CRUD Operations, Indexing Explain Plans, and Aggregation Pipelines."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, status
from app.db.mongodb import mongodb
from app.db.neo4j import neo4j_manager

router = APIRouter(prefix="/nosql", tags=["NoSQL Database Operations (CRUD, Indexing, Aggregations)"])


class StudentCreate(BaseModel):
    student_id: str = Field(..., json_schema_extra={"example": "23BCE0131"})
    name: str = Field(..., json_schema_extra={"example": "Dipanjan Das"})
    reg_no: str = Field(..., json_schema_extra={"example": "23BCE0131"})
    batch: str = Field(default="NS25", json_schema_extra={"example": "NS25"})
    course_code: str = Field(default="BCSE406L", json_schema_extra={"example": "BCSE406L"})


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    batch: Optional[str] = None
    course_code: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# 1. CRUD Operations: Students (Polyglot: MongoDB Document + Neo4j Node)
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/students", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_student(payload: StudentCreate):
    """
    CRUD: Create (C)
    Inserts a student document in MongoDB and a (:Student) node in Neo4j.
    """
    mongo_doc = await mongodb.create_student(payload.model_dump())
    neo4j_node = await neo4j_manager.create_student(
        student_id=payload.student_id, name=payload.name, reg_no=payload.reg_no
    )
    return {
        "message": "Student created in both MongoDB and Neo4j",
        "operation": "CREATE",
        "mongodb_document": mongo_doc,
        "neo4j_node": neo4j_node,
    }


@router.get("/students", response_model=List[dict])
async def list_students(limit: int = Query(50, ge=1, le=100)):
    """
    CRUD: Read All (R)
    Fetches student documents from MongoDB.
    """
    return await mongodb.list_students(limit=limit)


@router.get("/students/{student_id}", response_model=dict)
async def get_student(student_id: str):
    """
    CRUD: Read One (R)
    Retrieves student document by ID or registration number.
    """
    student = await mongodb.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
    return {
        "operation": "READ",
        "student": student,
    }


@router.put("/students/{student_id}", response_model=dict)
async def update_student(student_id: str, payload: StudentUpdate):
    """
    CRUD: Update (U)
    Updates student document fields in MongoDB and synchronizes properties to Neo4j.
    """
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    updated_mongo = await mongodb.update_student(student_id, update_data)
    if not updated_mongo:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    await neo4j_manager.update_student(student_id, update_data)
    return {
        "message": "Student updated successfully",
        "operation": "UPDATE",
        "student": updated_mongo,
    }


@router.delete("/students/{student_id}", response_model=dict)
async def delete_student(student_id: str):
    """
    CRUD: Delete (D)
    Deletes student document from MongoDB and performs Cypher DETACH DELETE in Neo4j.
    """
    deleted_mongo = await mongodb.delete_student(student_id)
    deleted_neo4j = await neo4j_manager.delete_student(student_id)
    return {
        "message": f"Student {student_id} deleted from MongoDB and detached in Neo4j",
        "operation": "DELETE",
        "mongodb_deleted": deleted_mongo,
        "neo4j_detached": deleted_neo4j,
    }


@router.delete("/submissions/{sub_id}", response_model=dict)
async def delete_submission(sub_id: str):
    """
    CRUD: Delete Submission (D)
    Removes submission from MongoDB document store.
    """
    success = await mongodb.delete_submission(sub_id)
    return {
        "message": f"Submission {sub_id} deleted",
        "operation": "DELETE",
        "success": success,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 2. Indexing: Active Indexes & Explain Plan Demonstration
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/indexes", response_model=dict)
async def get_database_indexes():
    """
    INDEXING DEMO:
    Returns all active single-field, compound, unique, and text indexes
    across MongoDB and Neo4j.
    """
    mongo_indexes = await mongodb.get_index_information()
    return {
        "database_type": "Polyglot NoSQL (MongoDB + Neo4j)",
        "mongodb_indexes": mongo_indexes,
        "neo4j_constraints_and_indexes": [
            {"name": "student_id_unique", "type": "UNIQUENESS CONSTRAINT", "target": "(:Student.id)"},
            {"name": "submission_id_unique", "type": "UNIQUENESS CONSTRAINT", "target": "(:Submission.id)"},
            {"name": "student_reg_no_idx", "type": "LOOKUP INDEX", "target": "(:Student.reg_no)"},
            {"name": "similarity_score_idx", "type": "RANGE INDEX", "target": "([r:SIMILAR_TO].score)"},
        ],
        "index_rationale": {
            "idx_pairs_batch_score_compound": "Optimizes queries filtering by batch_id and sorting by similarity score in descending order without in-memory sort.",
            "idx_student_id_unique": "Enforces strict academic integrity constraint preventing duplicate student records.",
            "idx_submissions_text_search": "Enables rapid full-text token search across source filenames and student names.",
        },
    }


@router.get("/indexes/explain", response_model=dict)
async def explain_index_plan(
    batch_id: str = Query("batch_ns25_demo", description="Batch ID to query"),
    min_score: float = Query(0.60, description="Minimum score threshold"),
):
    """
    INDEXING DEMO:
    Runs explain('executionStats') on MongoDB similarity pair query,
    proving index usage (IXSCAN) over full collection scan (COLLSCAN).
    """
    return await mongodb.explain_similarity_query(batch_id=batch_id, min_score=min_score)


# ──────────────────────────────────────────────────────────────────────────────
# 3. Aggregations: Multi-Stage MongoDB Pipelines & Cypher Graph Aggregations
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/aggregations/risk-distribution/{batch_id}", response_model=dict)
async def aggregate_risk_distribution(batch_id: str):
    """
    AGGREGATION PIPELINE 1 (MongoDB):
    Uses $match -> $switch -> $group -> $sort to categorize similarity pairs
    into Critical, High, Moderate, and Low risk tiers.
    """
    result = await mongodb.aggregate_risk_distribution(batch_id)
    return {
        "pipeline_name": "Risk Tier Bucket Aggregation",
        "batch_id": batch_id,
        "stages_used": ["$match", "$project with $switch", "$group", "$sort"],
        "distribution": result,
    }


@router.get("/aggregations/repeat-offenders", response_model=dict)
async def aggregate_repeat_offenders():
    """
    AGGREGATION PIPELINE 2 (MongoDB):
    Uses $group -> $lookup -> $unwind -> $project -> $sort to perform
    a relational-style join across similarity_pairs and students,
    surfacing students involved across multiple collusion incidents.
    """
    result = await mongodb.aggregate_repeat_offenders()
    return {
        "pipeline_name": "Cross-Assignment Repeat Offender Multi-Stage Join",
        "stages_used": ["$group", "$lookup (students)", "$unwind", "$project", "$sort"],
        "repeat_offenders": result,
    }


@router.get("/aggregations/cypher-network/{batch_id}", response_model=dict)
async def aggregate_cypher_network(batch_id: str):
    """
    AGGREGATION 3 (Neo4j Cypher):
    Performs graph traversal:
    MATCH (s)-[:SUBMITTED]->(sub)-[r:SIMILAR_TO]-(otherSub)<-[:SUBMITTED]-(peer)
    RETURN s.name, count(DISTINCT peer) AS co_conspirators_count, avg(r.score)
    """
    network = await neo4j_manager.aggregate_collusion_network(batch_id)
    return {
        "aggregation_type": "Cypher Multi-Hop Graph Traversal Aggregation",
        "batch_id": batch_id,
        "collusion_network_summary": network,
    }
