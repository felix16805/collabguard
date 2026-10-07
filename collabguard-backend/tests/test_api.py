"""Integration tests for FastAPI endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "databases" in data


def test_demo_graph_and_reports(client):
    # Fetch demo graph
    graph_res = client.get("/api/graph/batch_ns25_demo")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert "nodes" in graph_data
    assert "links" in graph_data
    assert len(graph_data["nodes"]) > 0

    # Fetch demo report
    report_res = client.get("/api/reports/batch_ns25_demo")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["batch_id"] == "batch_ns25_demo"
    assert len(report_data["clusters"]) >= 1


def test_shortest_path_tracing(client):
    response = client.get(
        "/api/graph/batch_ns25_demo/shortest-path?student_a=21BCE1001&student_b=21BCE1042"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["has_path"] is True
    assert len(data["path"]) >= 2
