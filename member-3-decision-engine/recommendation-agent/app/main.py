"""
Recommendation Agent - Application Entry Point

Bootstraps the FastAPI application with CORS middleware, mounts the
versioned API router, and exposes the top-level health and domain
endpoints required by the spec (GET /, GET /health, POST /recommend).
"""

from fastapi import FastAPI, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.api.v1.endpoints import recommendation
from app.core.config import settings
from app.core.database import get_db
from app.core.logging import logger
from app.schemas.recommendation_request import RecommendationRequest
from app.schemas.recommendation_response import RecommendationResponse
from app.services.recommendation_service import RecommendationService

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        f"**{settings.PROJECT_NAME}** — Executive Recommendation Agent\n\n"
        "Aggregates outputs from the Demand Forecast, Inventory, Supply Chain, "
        "and Production Planning agents and returns an executive recommendation "
        "report with production, inventory, supplier, and risk guidance."
    ),
    contact={"name": "ManuSphere AI — Member 3"},
    license_info={"name": "MIT"},
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
# Versioned API routes  (/api/v1/...) & Routers
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(recommendation.router, prefix="/recommendations", tags=["recommendations"])
app.include_router(recommendation.router, tags=["Recommendations"])

# ---------------------------------------------------------------------------
# Top-level routes required by the spec (GET /, GET /health, POST /recommend)
# ---------------------------------------------------------------------------

@app.get("/", summary="Welcome", tags=["Health"])
async def root() -> dict:
    """Welcome message — confirms the Recommendation Agent is reachable."""
    logger.info("GET / called")
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "message": f"Welcome to {settings.PROJECT_NAME}",
    }


@app.get("/health", summary="Health check", tags=["Health"])
async def health_check() -> dict:
    """Liveness probe — returns 200 OK when the service is running."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.post(
    "/recommend",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Executive Recommendation",
    description="Accepts demand, inventory, supply chain, and production planning outputs and returns actionable business recommendations.",
    tags=["Recommendations"],
)
async def recommend_root(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
) -> RecommendationResponse:
    """Root endpoint for generating executive recommendations."""
    service = RecommendationService()
    return await service.recommend(request, db=db)


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
