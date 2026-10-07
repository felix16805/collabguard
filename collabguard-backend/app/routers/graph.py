"""Graph exploration and topology router."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.db.neo4j import neo4j_manager
from app.schemas.graph import GraphResponse, ShortestPathResponse

router = APIRouter(prefix="/graph", tags=["Graph Network"])


@router.get("/{batch_id}", response_model=dict)
async def get_graph(batch_id: str):
    """
    Retrieve full graph network for a batch, including student nodes,
    submission nodes, similarity edges, and Louvain community clusters.
    """
    graph_data = await neo4j_manager.get_graph_data(batch_id)
    if not graph_data["nodes"]:
        raise HTTPException(
            status_code=404,
            detail=f"No graph data found for batch {batch_id}. Please seed demo data or upload a batch.",
        )
    return graph_data


@router.get("/{batch_id}/shortest-path", response_model=ShortestPathResponse)
async def get_shortest_path(
    batch_id: str,
    student_a: str = Query(..., description="First student ID or registration number"),
    student_b: str = Query(..., description="Second student ID or registration number"),
):
    """
    Trace shortest collusion path between two students via similarity edges.
    Surfaces indirect collusion (e.g. Student A -> Student B -> Student C).
    """
    path = await neo4j_manager.find_shortest_path(student_a, student_b)
    if not path:
        return ShortestPathResponse(
            student_a_id=student_a,
            student_b_id=student_b,
            has_path=False,
            path=None,
            hops=0,
        )

    return ShortestPathResponse(
        student_a_id=student_a,
        student_b_id=student_b,
        has_path=True,
        path=path,
        hops=len(path) - 1,
    )
