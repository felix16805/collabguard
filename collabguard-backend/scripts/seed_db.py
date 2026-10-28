"""
Standalone Database Seeder for CollabGuard (Course BCSE406L).
Populates MongoDB with sample students, assignments, and submissions,
and loads the collusion similarity graph into Neo4j with Winnowing scores and Louvain clusters.

Usage:
    python scripts/seed_db.py
"""
import asyncio
import sys
import os
import logging

# Add parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.mongodb import mongodb
from app.db.neo4j import neo4j_manager
from app.routers.demo import seed_demo_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_db")


async def main():
    logger.info("=" * 60)
    logger.info("COLLABGUARD — NOSQL DATABASE SEEDER (BCSE406L)")
    logger.info("=" * 60)
    logger.info(f"Target MongoDB: {settings.MONGODB_URI} (DB: {settings.MONGODB_DB_NAME})")
    logger.info(f"Target Neo4j:   {settings.NEO4J_URI} (User: {settings.NEO4J_USER})")

    # 1. Connect MongoDB
    logger.info("\n[1/4] Connecting to MongoDB...")
    await mongodb.connect()
    if mongodb.is_connected:
        logger.info("  ✓ MongoDB connected & indexes ensured.")
    else:
        logger.warning("  ⚠ MongoDB unreachable, seeding into memory fallback.")

    # 2. Connect Neo4j
    logger.info("\n[2/4] Connecting to Neo4j...")
    await neo4j_manager.connect()
    if neo4j_manager.is_connected:
        logger.info("  ✓ Neo4j connected & schema constraints ensured.")
    else:
        logger.warning("  ⚠ Neo4j unreachable, seeding into memory fallback.")

    # 3. Seed Students, Submissions, AST Fingerprints & Graph
    logger.info("\n[3/4] Processing Submissions through AST Tokenizer & Winnowing Pipeline...")
    res = await seed_demo_data()

    logger.info(f"\n[4/4] Seeding Complete!")
    logger.info(f"  • Batch ID:       {res['batch_id']}")
    logger.info(f"  • Course:         BCSE406L — NoSQL Databases")
    logger.info(f"  • Submissions:    {res['summary']['submission_count']}")
    logger.info(f"  • Flagged Pairs:  {len(res['flagged_pairs'])}")
    logger.info(f"  • Communities:    {len(res['clusters'])}")

    logger.info("\nSample Flagged Pairs seeded:")
    for pair in res["flagged_pairs"]:
        logger.info(
            f"  - [{pair['sub1_id']}] <-> [{pair['sub2_id']}]: "
            f"Score = {pair['score']:.3f} | {pair['student1_name']} & {pair['student2_name']}"
        )

    # Clean shutdown
    await mongodb.close()
    await neo4j_manager.close()
    logger.info("\n" + "=" * 60)
    logger.info("Database seeding successfully finished.")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
