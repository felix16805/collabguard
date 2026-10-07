"""FastAPI main application entrypoint with lifespan event management."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import mongodb
from app.db.neo4j import neo4j_manager
from app.routers import auth, submissions, graph, reports, demo, ml

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("collabguard.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown management."""
    logger.info("Initializing CollabGuard backend services...")
    # 1. Connect MongoDB
    await mongodb.connect()
    # 2. Connect Neo4j
    await neo4j_manager.connect()
    # 3. Auto-seed demo dataset on startup so frontend demo works out of the box
    try:
        from app.routers.demo import seed_demo_data
        await seed_demo_data()
        logger.info("Auto-seeded demo batch (batch_ns25_demo) successfully.")
    except Exception as e:
        logger.warning(f"Could not auto-seed demo batch: {e}")

    yield

    logger.info("Shutting down CollabGuard backend services...")
    await mongodb.close()
    await neo4j_manager.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Graph-based code collusion detection API using AST Tokenization, Winnowing, and Neo4j Louvain Community Detection.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Setup CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(submissions.router, prefix=settings.API_V1_STR)
app.include_router(graph.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(demo.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "service": "CollabGuard API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/api/health",
    }


@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    """System health check and database connectivity status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "databases": {
            "mongodb": {
                "connected": mongodb.is_connected,
                "status": "connected" if mongodb.is_connected else "in_memory_fallback",
            },
            "neo4j": {
                "connected": neo4j_manager.is_connected,
                "status": "connected" if neo4j_manager.is_connected else "networkx_fallback",
            },
        },
    }
