"""Code semantic embedding module using subword/token vectorization and cosine distance."""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Tuple
from app.engine.tokenizer import tokenize_python_code


class CodeSemanticEmbedder:
    """
    Computes dense/sparse semantic representations of source code.
    Detects semantic paraphrasing, logic reordering, and structure-preserving transformations.
    """

    def __init__(self):
        # Character and word n-gram vectorizer capturing sub-lexical and structural patterns
        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            min_df=1,
            sublinear_tf=True,
        )
        self.is_fitted = False

    def fit_transform(self, code_snippets: List[str]) -> np.ndarray:
        """Fit vectorizer on a corpus of code submissions and return embedding matrix."""
        normalized_texts = [self._preprocess(code) for code in code_snippets]
        embeddings = self.vectorizer.fit_transform(normalized_texts)
        self.is_fitted = True
        return embeddings

    def compute_pair_similarity(self, code1: str, code2: str) -> float:
        """Compute cosine similarity between two code snippets."""
        p1 = self._preprocess(code1)
        p2 = self._preprocess(code2)

        if not self.is_fitted:
            # Temporary single-pair vectorizer
            vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)
            try:
                matrix = vec.fit_transform([p1, p2])
                sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
                return float(round(sim, 4))
            except Exception:
                return 0.0

        try:
            m1 = self.vectorizer.transform([p1])
            m2 = self.vectorizer.transform([p2])
            sim = cosine_similarity(m1, m2)[0][0]
            return float(round(sim, 4))
        except Exception:
            return 0.0

    def _preprocess(self, code: str) -> str:
        """Tokenize code into normalized tokens sequence string."""
        tokens = tokenize_python_code(code)
        if not tokens:
            return code.strip()
        return " ".join(t.normalized_value for t in tokens)
