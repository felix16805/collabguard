"""Tests for CollabGuard Machine Learning and Active Learning subsystem."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml.boilerplate import BoilerplateDetector
from app.ml.embeddings import CodeSemanticEmbedder
from app.ml.classifier import ml_classifier
from app.engine.winnowing import Fingerprint


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_boilerplate_detector_filters_common_hashes():
    # 4 submissions, hash 999 appears in all 4 (boilerplate)
    sub1 = [Fingerprint(999, 1, 2, 0), Fingerprint(101, 3, 4, 1)]
    sub2 = [Fingerprint(999, 1, 2, 0), Fingerprint(102, 3, 4, 1)]
    sub3 = [Fingerprint(999, 1, 2, 0), Fingerprint(103, 3, 4, 1)]
    sub4 = [Fingerprint(999, 1, 2, 0), Fingerprint(104, 3, 4, 1)]

    detector = BoilerplateDetector(frequency_threshold=0.50)
    detector.fit([sub1, sub2, sub3, sub4])

    assert 999 in detector.boilerplate_hashes
    assert 101 not in detector.boilerplate_hashes

    filtered = detector.filter_fingerprints(sub1)
    assert len(filtered) == 1
    assert filtered[0].hash_value == 101


def test_semantic_embedder_captures_logic_similarity():
    embedder = CodeSemanticEmbedder()
    code_a = """
def factorial(n):
    res = 1
    for i in range(1, n + 1):
        res = res * i
    return res
"""
    code_b = """
def compute_fact(number):
    product = 1
    for val in range(1, number + 1):
        product = product * val
    return product
"""
    sim = embedder.compute_pair_similarity(code_a, code_b)
    assert sim >= 0.70


def test_classifier_predicts_risk_with_explanations():
    pair_data = {
        "score": 0.92,
        "containment": 0.95,
        "total_fp_1": 30,
        "total_fp_2": 28,
        "boilerplate_overlap": 0.05,
    }
    code_a = "def calculate(arr):\n    total = 0\n    for x in arr:\n        total += x\n    return total"
    code_b = "def compute_sum(nums):\n    res = 0\n    for item in nums:\n        res += item\n    return res"
    prediction = ml_classifier.predict_pair(
        pair_data,
        code1=code_a,
        code2=code_b,
    )
    assert prediction["collusion_probability"] >= 0.70
    assert "verdict" in prediction
    assert len(prediction["explanations"]) >= 1


def test_ml_api_endpoints(client):
    # Test status endpoint
    status_res = client.get("/api/ml/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "feature_importances" in status_data
    assert status_data["is_trained"] is True

    # Test predict-pair endpoint
    predict_res = client.post("/api/ml/predict-pair", json={
        "batch_id": "batch_ns25_demo",
        "sub1_id": "sub_dijkstra_01",
        "sub2_id": "sub_dijkstra_02",
    })
    assert predict_res.status_code == 200
    pred = predict_res.json()["prediction"]
    assert "collusion_probability" in pred
    assert "category" in pred

    # Test feedback submission
    feedback_res = client.post("/api/ml/feedback", json={
        "batch_id": "batch_ns25_demo",
        "sub1_id": "sub_dijkstra_01",
        "sub2_id": "sub_dijkstra_02",
        "student1_id": "21BCE1001",
        "student2_id": "21BCE1042",
        "is_collusion": True,
        "notes": "Verified identical control flow and logic",
    })
    assert feedback_res.status_code == 200

    # Submit second feedback to allow retraining
    client.post("/api/ml/feedback", json={
        "batch_id": "batch_ns25_demo",
        "sub1_id": "sub_bfs_06",
        "sub2_id": "sub_dfs_07",
        "student1_id": "21BCE1340",
        "student2_id": "21BCE1412",
        "is_collusion": False,
        "notes": "Different algorithms (BFS vs DFS)",
    })

    # Test retrain endpoint
    retrain_res = client.post("/api/ml/retrain")
    assert retrain_res.status_code == 200
    assert retrain_res.json()["details"]["status"] == "retrained"
