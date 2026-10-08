"""Unit and integration tests for NoSQL CRUD operations, indexing, and aggregations."""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_student_crud_lifecycle(client):
    """Test full CRUD lifecycle for student records (Polyglot: MongoDB + Neo4j)."""
    student_id = "23BCE0131"

    # 1. CREATE
    create_res = client.post("/api/nosql/students", json={
        "student_id": student_id,
        "name": "Dipanjan Das",
        "reg_no": "23BCE0131",
        "batch": "NS25",
        "course_code": "BCSE406L",
    })
    assert create_res.status_code == 201
    assert create_res.json()["operation"] == "CREATE"

    # 2. READ (One)
    get_res = client.get(f"/api/nosql/students/{student_id}")
    assert get_res.status_code == 200
    assert get_res.json()["student"]["name"] == "Dipanjan Das"

    # 3. READ (All)
    list_res = client.get("/api/nosql/students?limit=10")
    assert list_res.status_code == 200
    assert isinstance(list_res.json(), list)

    # 4. UPDATE
    update_res = client.put(f"/api/nosql/students/{student_id}", json={
        "name": "Dipanjan Das (Lead)",
        "batch": "NS25-ALPHA",
    })
    assert update_res.status_code == 200
    assert update_res.json()["student"]["name"] == "Dipanjan Das (Lead)"

    # 5. DELETE
    del_res = client.delete(f"/api/nosql/students/{student_id}")
    assert del_res.status_code == 200
    assert del_res.json()["operation"] == "DELETE"


def test_database_indexes_and_explain(client):
    """Test index introspection and query explain execution plan."""
    # Check index listings
    indexes_res = client.get("/api/nosql/indexes")
    assert indexes_res.status_code == 200
    data = indexes_res.json()
    assert "mongodb_indexes" in data
    assert "neo4j_constraints_and_indexes" in data

    # Check query execution plan (Index Scan verification)
    explain_res = client.get("/api/nosql/indexes/explain?batch_id=batch_ns25_demo&min_score=0.60")
    assert explain_res.status_code == 200
    plan = explain_res.json()
    assert plan["stage"] == "IXSCAN"
    assert plan["is_index_used"] is True


def test_nosql_aggregations(client):
    """Test multi-stage MongoDB aggregations and Cypher graph aggregations."""
    # 1. MongoDB Risk Distribution Aggregation ($match -> $project -> $group -> $sort)
    risk_res = client.get("/api/nosql/aggregations/risk-distribution/batch_ns25_demo")
    assert risk_res.status_code == 200
    assert "distribution" in risk_res.json()
    assert isinstance(risk_res.json()["distribution"], list)

    # 2. MongoDB Repeat Offender Multi-Stage Join Aggregation ($group -> $lookup -> $unwind)
    repeat_res = client.get("/api/nosql/aggregations/repeat-offenders")
    assert repeat_res.status_code == 200
    assert "repeat_offenders" in repeat_res.json()

    # 3. Neo4j Cypher Multi-Hop Graph Traversal Aggregation
    cypher_res = client.get("/api/nosql/aggregations/cypher-network/batch_ns25_demo")
    assert cypher_res.status_code == 200
    assert "collusion_network_summary" in cypher_res.json()
