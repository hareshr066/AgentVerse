from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.endpoints import production
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically initialize db schema on startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        pass
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        f"**{settings.PROJECT_NAME}** — ManuSphere AI Decision Engine\n\n"
        "Receives demand forecast, inventory, and capacity data from peer agents "
        "and returns an optimised production plan with machine scheduling, "
        "capacity utilisation, and priority classification."
    ),
    lifespan=lifespan
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Versioned API routes  (/api/v1/...)
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(production.router, prefix="/production-plans", tags=["production-plans"])

# ---------------------------------------------------------------------------
# Top-level routes required by the spec
# GET /        — welcome
# GET /health  — liveness probe
# POST /production-plan — main domain endpoint (also under /api/v1/)
# ---------------------------------------------------------------------------

@app.get(
    "/",
    summary="Welcome",
    tags=["Health"],
)
async def root() -> dict:
    """Welcome message — confirms the Production Planning Agent is reachable."""
    logger.info("GET / called")
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "message": f"Welcome to {settings.PROJECT_NAME}",
    }


@app.get(
    "/health",
    summary="Health check",
    tags=["Health"],
)
async def health_check() -> dict:
    """Liveness probe — returns 200 OK when the service is running."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


# ---------------------------------------------------------------------------
# Startup / shutdown events
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    logger.info(
        "%s v%s starting up...", settings.PROJECT_NAME, settings.VERSION
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("%s shutting down.", settings.PROJECT_NAME)
