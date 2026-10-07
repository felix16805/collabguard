"""Graph structural embeddings and topological link features (Node2Vec & centrality)."""
import math
import random
from typing import Dict, List, Tuple
import networkx as nx
import numpy as np


class GraphStructuralEmbedder:
    """
    Computes topological embeddings and link prediction features from the collusion network.
    Identifies high-betweenness 'code brokers' and indirect sharing paths.
    """

    def __init__(self, walk_length: int = 10, num_walks: int = 20, embedding_dim: int = 16):
        self.walk_length = walk_length
        self.num_walks = num_walks
        self.embedding_dim = embedding_dim
        self.centrality_cache: Dict[str, float] = {}

    def extract_pair_graph_features(
        self,
        graph: nx.Graph,
        student_a: str,
        student_b: str,
    ) -> Dict[str, float]:
        """
        Extract structural features connecting two students in the collusion graph.
        """
        node_a = f"student_{student_a}"
        node_b = f"student_{student_b}"

        if not graph.has_node(node_a) or not graph.has_node(node_b):
            return {
                "common_neighbors_count": 0.0,
                "jaccard_neighborhood": 0.0,
                "betweenness_max": 0.0,
                "shortest_path_length": 99.0,
            }

        # 1. Common neighbors & Jaccard coefficient
        neighbors_a = set(graph.neighbors(node_a))
        neighbors_b = set(graph.neighbors(node_b))
        common = neighbors_a.intersection(neighbors_b)
        union = neighbors_a.union(neighbors_b)

        jaccard = len(common) / len(union) if union else 0.0

        # 2. Betweenness Centrality (cached per graph)
        if not self.centrality_cache:
            try:
                self.centrality_cache = nx.betweenness_centrality(graph, weight="weight")
            except Exception:
                self.centrality_cache = {n: 0.0 for n in graph.nodes()}

        b_a = self.centrality_cache.get(node_a, 0.0)
        b_b = self.centrality_cache.get(node_b, 0.0)

        # 3. Shortest Path length
        try:
            path_len = float(nx.shortest_path_length(graph, source=node_a, target=node_b))
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            path_len = 99.0

        return {
            "common_neighbors_count": float(len(common)),
            "jaccard_neighborhood": float(round(jaccard, 4)),
            "betweenness_max": float(round(max(b_a, b_b), 4)),
            "shortest_path_length": path_len,
        }
