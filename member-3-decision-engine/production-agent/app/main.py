from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.api.v1.endpoints import production
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import logger
from app.schemas.production_request import ProductionPlanRequest
from app.schemas.production_response import ProductionPlanResponse
from app.services.production_service import ProductionPlannerService

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
        "and returns an optimized production plan with machine scheduling, "
        "capacity utilization, priority classification, and bottleneck detection."
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
# Versioned API routes (/api/v1/...) & routers
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(production.router, prefix="/production-plans", tags=["production-plans"])
app.include_router(production.router, tags=["Production Planning"])

# ---------------------------------------------------------------------------
# Top-level routes required by the spec
# GET /             — welcome
# GET /health       — liveness probe
# POST /production-plan — main domain endpoint
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


@app.post(
    "/production-plan",
    response_model=ProductionPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Production Plan",
    description="Calculate production quantity, schedule, utilization, and priority.",
    tags=["Production Planning"],
)
def create_production_plan_root(request: ProductionPlanRequest) -> ProductionPlanResponse:
    """Root endpoint for generating an optimized production plan."""
    service = ProductionPlannerService()
    return service.generate_plan(request)


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
