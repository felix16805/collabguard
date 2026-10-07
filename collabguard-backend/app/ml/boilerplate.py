"""Unsupervised Boilerplate & Starter Code Auto-Learner."""
from collections import Counter
from typing import Dict, List, Set
from app.engine.winnowing import Fingerprint


class BoilerplateDetector:
    """
    Learns common assignment starter-code and template patterns across submissions.
    Automatically filters out fingerprints that appear in a large fraction of the class.
    """

    def __init__(self, frequency_threshold: float = 0.55):
        self.frequency_threshold = frequency_threshold
        self.boilerplate_hashes: Set[int] = set()
        self.total_submissions: int = 0

    def fit(self, all_submission_fingerprints: List[List[Fingerprint]]) -> "BoilerplateDetector":
        """
        Scan all submissions in a batch to identify ubiquitous k-gram hashes.
        """
        self.total_submissions = len(all_submission_fingerprints)
        if self.total_submissions < 3:
            # Not enough samples to distinguish boilerplate from collusion
            self.boilerplate_hashes = set()
            return self

        # Count document frequency of each hash
        doc_freq = Counter()
        for fp_list in all_submission_fingerprints:
            unique_hashes = set(fp.hash_value for fp in fp_list)
            for h in unique_hashes:
                doc_freq[h] += 1

        # Hashes appearing in >= threshold fraction of submissions are considered boilerplate
        cutoff = self.total_submissions * self.frequency_threshold
        self.boilerplate_hashes = {
            h for h, count in doc_freq.items() if count >= cutoff
        }
        return self

    def filter_fingerprints(self, fps: List[Fingerprint]) -> List[Fingerprint]:
        """Remove identified boilerplate fingerprints from a submission."""
        return [fp for fp in fps if fp.hash_value not in self.boilerplate_hashes]

    def get_boilerplate_overlap_ratio(self, fp1: List[Fingerprint], fp2: List[Fingerprint]) -> float:
        """Calculate the proportion of shared fingerprints that are merely course template code."""
        set1 = set(fp.hash_value for fp in fp1)
        set2 = set(fp.hash_value for fp in fp2)
        shared = set1.intersection(set2)
        if not shared:
            return 0.0

        shared_boilerplate = shared.intersection(self.boilerplate_hashes)
        return len(shared_boilerplate) / len(shared)
