"""Faculty feedback collector and active learning manager."""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.db.mongodb import mongodb
from app.ml.classifier import ml_classifier

logger = logging.getLogger("collabguard.ml.feedback")


class FacultyFeedbackManager:
    """Manages active learning loop and storage of faculty ground-truth decisions."""

    _in_memory_feedback: List[Dict[str, Any]] = []

    async def record_feedback(
        self,
        batch_id: str,
        sub1_id: str,
        sub2_id: str,
        student1_id: str,
        student2_id: str,
        is_collusion: bool,
        notes: Optional[str] = None,
        features: Optional[List[float]] = None,
    ) -> Dict[str, Any]:
        """Record faculty review verdict for a pair."""
        feedback_doc = {
            "batch_id": batch_id,
            "sub1_id": sub1_id,
            "sub2_id": sub2_id,
            "student1_id": student1_id,
            "student2_id": student2_id,
            "label": 1 if is_collusion else 0,
            "is_collusion": is_collusion,
            "notes": notes or "",
            "features": features or [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if mongodb.is_connected and mongodb.db is not None:
            try:
                await mongodb.db.faculty_feedback.insert_one(feedback_doc)
            except Exception as e:
                logger.error(f"Failed to persist feedback in MongoDB: {e}")

        self._in_memory_feedback.append(feedback_doc)
        logger.info(f"Recorded feedback for {student1_id} vs {student2_id} (label={feedback_doc['label']})")
        return {"status": "recorded", "feedback_count": len(self._in_memory_feedback)}

    async def retrain_model_from_feedback(self) -> Dict[str, Any]:
        """Fetch all historical faculty feedback samples and retrain the classifier."""
        samples = []
        if mongodb.is_connected and mongodb.db is not None:
            cursor = mongodb.db.faculty_feedback.find({"features": {"$ne": []}})
            async for doc in cursor:
                if len(doc.get("features", [])) == 7:
                    samples.append((doc["features"], doc["label"]))

        # Also add in-memory feedback samples
        for doc in self._in_memory_feedback:
            if len(doc.get("features", [])) == 7:
                samples.append((doc["features"], doc["label"]))

        if len(samples) < 2:
            return {
                "status": "skipped",
                "message": "Need at least 2 labeled feedback samples to retrain model.",
                "total_available": len(samples),
            }

        result = ml_classifier.retrain_incremental(samples)
        return {
            "status": "retrained",
            "samples_trained": len(samples),
            "feature_importances": result.get("feature_importances", {}),
        }


feedback_manager = FacultyFeedbackManager()
