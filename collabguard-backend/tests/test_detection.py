"""Unit tests for AST tokenization, normalization, and Winnowing similarity."""
import pytest
from app.engine.tokenizer import tokenize_python_code
from app.engine.winnowing import compute_winnowing_fingerprints, calculate_similarity


def test_ast_normalizer_catches_variable_renaming():
    code_a = """
def calculate_sum(numbers_list):
    total_val = 0
    for num in numbers_list:
        total_val += num
    return total_val
"""
    code_b = """
def calculate_sum(data):
    # Student renamed variables and added comments
    res = 0
    for item in data:
        res += item
    return res
"""
    tokens_a = tokenize_python_code(code_a)
    tokens_b = tokenize_python_code(code_b)

    assert len(tokens_a) > 0
    assert len(tokens_b) > 0

    fp_a = compute_winnowing_fingerprints(tokens_a, k=5, t=3)
    fp_b = compute_winnowing_fingerprints(tokens_b, k=5, t=3)

    metrics = calculate_similarity(fp_a, fp_b)
    # Identical normalized AST structure should yield very high similarity
    assert metrics["score"] >= 0.90
    assert metrics["shared_count"] > 0


def test_dissimilar_code_yields_low_score():
    code_a = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
"""
    code_b = """
import math
def compute_circle_area(radius):
    if radius < 0:
        raise ValueError("Radius must be non-negative")
    return math.pi * (radius ** 2)
"""
    tokens_a = tokenize_python_code(code_a)
    tokens_b = tokenize_python_code(code_b)

    fp_a = compute_winnowing_fingerprints(tokens_a, k=8, t=4)
    fp_b = compute_winnowing_fingerprints(tokens_b, k=8, t=4)

    metrics = calculate_similarity(fp_a, fp_b)
    assert metrics["score"] < 0.35
