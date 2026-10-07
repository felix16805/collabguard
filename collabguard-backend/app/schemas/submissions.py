"""Submissions and batch processing schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field


class SubmissionItem(BaseModel):
    id: str
    student_id: str
    student_name: str
    reg_no: str
    filename: str
    code: str


class BatchUploadRequest(BaseModel):
    batch_name: str = Field(..., json_schema_extra={"example": "Assignment 1 - Shortest Path Graph Algorithms"})
    assignment_id: str = Field(..., json_schema_extra={"example": "BCSE406L_DA1"})
    course_code: str = Field(default="BCSE406L", json_schema_extra={"example": "BCSE406L"})
    similarity_threshold: float = Field(default=0.60, ge=0.1, le=1.0)
    submissions: List[SubmissionItem]


class BatchSummary(BaseModel):
    batch_id: str
    assignment_id: str
    total_submissions: int
    total_students: int
    flagged_pairs_count: int
    clusters_count: int
    status: str
    threshold: float
    highest_similarity: float
    processed_at: str
