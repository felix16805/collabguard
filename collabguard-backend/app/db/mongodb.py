"""MongoDB async connection and collection manager using Motor."""
import logging
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("collabguard.mongodb")

class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False

    # In-memory fallback dictionary if MongoDB is temporarily unavailable
    _mock_data: Dict[str, Dict[str, Any]] = {
        "users": {},
        "students": {},
        "assignments": {},
        "batches": {},
        "submissions": {},
        "similarity_pairs": {},
        "clusters": {},
    }

    async def connect(self):
        """Initialize connection to MongoDB and ensure collections & indexes."""
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2500,
            )
            self.db = self.client[settings.MONGODB_DB_NAME]
            # Quick ping to verify connection
            await self.client.admin.command("ping")
            self.is_connected = True
            logger.info("Successfully connected to MongoDB Atlas / Local Daemon.")
            await self._create_indexes()
        except Exception as e:
            self.is_connected = False
            logger.warning(
                f"Could not connect to MongoDB ({e}). Running with in-memory fallback store."
            )

    async def _create_indexes(self):
        """Create indexes for optimal querying."""
        if not self.is_connected or self.db is None:
            return
        try:
            # Users index
            await self.db.users.create_index("email", unique=True)
            # Students index
            await self.db.students.create_index("student_id", unique=True)
            # Submissions index
            await self.db.submissions.create_index([("batch_id", 1), ("student_id", 1)])
            # Similarity pairs index
            await self.db.similarity_pairs.create_index([("batch_id", 1), ("score", -1)])
            await self.db.similarity_pairs.create_index([("sub1_id", 1), ("sub2_id", 1)])
            # Batches index
            await self.db.batches.create_index("batch_id", unique=True)
            logger.info("MongoDB indexes verified.")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

    async def close(self):
        """Close client connection."""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB connection closed.")

    def get_collection(self, collection_name: str):
        """Return collection or proxy."""
        if self.is_connected and self.db is not None:
            return self.db[collection_name]
        return None


mongodb = MongoDBManager()
