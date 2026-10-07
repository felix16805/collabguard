"""Graph and reporting schemas."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    reg_no: Optional[str] = None
    cluster: Optional[int] = None
    degree: int = 0


class GraphLink(BaseModel):
    source: str
    target: str
    rel_type: str
    weight: float
    score: Optional[float] = None
    shared_kgrams: int = 0


class GraphResponse(BaseModel):
    batch_id: str
    nodes: List[GraphNode]
    links: List[GraphLink]
    total_nodes: int
    total_edges: int


class ShortestPathResponse(BaseModel):
    student_a_id: str
    student_b_id: str
    has_path: bool
    path: Optional[List[str]] = None
    hops: int = 0


class CodeInterval(BaseModel):
    start: int
    end: int


class SimilarityPairDetail(BaseModel):
    batch_id: str
    sub1_id: str
    sub2_id: str
    student1_id: str
    student2_id: str
    student1_name: str
    student2_name: str
    filename1: str
    filename2: str
    score: float
    jaccard: float
    containment: float
    shared_kgrams: int
    matched_intervals_1: List[CodeInterval]
    matched_intervals_2: List[CodeInterval]
    code1: Optional[str] = None
    code2: Optional[str] = None
