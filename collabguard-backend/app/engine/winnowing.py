"""Winnowing fingerprinting algorithm and pairwise similarity metrics (MOSS style)."""
import hashlib
from dataclasses import dataclass
from typing import Any, Dict, List, Set, Tuple
from app.engine.tokenizer import CodeToken


@dataclass
class Fingerprint:
    hash_value: int
    start_line: int
    end_line: int
    token_index: int


def hash_kgram(tokens: List[CodeToken]) -> int:
    """Compute deterministic 64-bit hash for a sequence of tokens."""
    signature = "_".join(t.normalized_value for t in tokens)
    digest = hashlib.sha256(signature.encode("utf-8")).digest()
    # Take first 8 bytes as unsigned 64-bit integer
    return int.from_bytes(digest[:8], byteorder="big")


def compute_winnowing_fingerprints(
    tokens: List[CodeToken],
    k: int = 25,
    t: int = 10,
) -> List[Fingerprint]:
    """
    Apply Schleimer et al. Winnowing algorithm to select robust fingerprints.
    k: k-gram size (number of consecutive tokens)
    t: window size
    """
    if not tokens:
        return []

    # Adjust k if token count is less than default k
    effective_k = min(k, max(3, len(tokens) // 2))
    effective_t = min(t, max(2, len(tokens) // 4))

    # 1. Generate k-gram hashes with position tracking
    kgram_hashes: List[Tuple[int, int, int, int]] = []  # (hash, start_line, end_line, token_idx)
    for i in range(len(tokens) - effective_k + 1):
        kgram = tokens[i : i + effective_k]
        h = hash_kgram(kgram)
        start_line = kgram[0].lineno
        end_line = kgram[-1].end_lineno
        kgram_hashes.append((h, start_line, end_line, i))

    if not kgram_hashes:
        # Fallback for very small files
        if tokens:
            h = hash_kgram(tokens)
            return [Fingerprint(h, tokens[0].lineno, tokens[-1].end_lineno, 0)]
        return []

    # 2. Slide window of size t and winnow minimum hash
    fingerprints: List[Fingerprint] = []
    min_idx = -1

    for i in range(len(kgram_hashes) - effective_t + 1):
        window = kgram_hashes[i : i + effective_t]
        # Find minimum hash in current window (rightmost on tie)
        min_in_window = min(window, key=lambda x: x[0])
        chosen_idx = i + [w[0] for w in window].index(min_in_window[0])

        if chosen_idx != min_idx:
            min_idx = chosen_idx
            fingerprints.append(
                Fingerprint(
                    hash_value=min_in_window[0],
                    start_line=min_in_window[1],
                    end_line=min_in_window[2],
                    token_index=min_in_window[3],
                )
            )

    return fingerprints


def calculate_similarity(
    fp1: List[Fingerprint],
    fp2: List[Fingerprint],
) -> Dict[str, Any]:
    """
    Calculate Jaccard and containment similarity scores between two fingerprint sets,
    along with matched line intervals.
    """
    hashes1 = {f.hash_value: f for f in fp1}
    hashes2 = {f.hash_value: f for f in fp2}

    set1 = set(hashes1.keys())
    set2 = set(hashes2.keys())

    common_hashes = set1.intersection(set2)
    union_hashes = set1.union(set2)

    if not union_hashes:
        return {
            "score": 0.0,
            "jaccard": 0.0,
            "containment": 0.0,
            "shared_count": 0,
            "matched_intervals_1": [],
            "matched_intervals_2": [],
        }

    jaccard = len(common_hashes) / len(union_hashes)
    min_len = min(len(set1), len(set2))
    containment = len(common_hashes) / min_len if min_len > 0 else 0.0

    # Composite similarity score (weights containment slightly higher to catch partial copying)
    score = (0.4 * jaccard) + (0.6 * containment)

    # Extract matched line spans for diff highlighting
    intervals1 = []
    intervals2 = []
    for h in common_hashes:
        if h in hashes1:
            intervals1.append({
                "start": hashes1[h].start_line,
                "end": hashes1[h].end_line,
            })
        if h in hashes2:
            intervals2.append({
                "start": hashes2[h].start_line,
                "end": hashes2[h].end_line,
            })

    # Sort and coalesce overlapping intervals
    def coalesce(intervals):
        if not intervals:
            return []
        sorted_int = sorted(intervals, key=lambda x: x["start"])
        merged = [sorted_int[0]]
        for cur in sorted_int[1:]:
            prev = merged[-1]
            if cur["start"] <= prev["end"] + 1:
                prev["end"] = max(prev["end"], cur["end"])
            else:
                merged.append(cur)
        return merged

    return {
        "score": round(score, 4),
        "jaccard": round(jaccard, 4),
        "containment": round(containment, 4),
        "shared_count": len(common_hashes),
        "total_fp_1": len(set1),
        "total_fp_2": len(set2),
        "matched_intervals_1": coalesce(intervals1),
        "matched_intervals_2": coalesce(intervals2),
    }
