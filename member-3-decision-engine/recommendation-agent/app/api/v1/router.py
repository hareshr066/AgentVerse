"""
Recommendation Agent - API v1 Router

Aggregates all endpoint routers under the /api/v1 prefix.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import status
from app.api.v1.endpoints import health
from app.api.v1.endpoints import recommendation

api_router = APIRouter()

# Existing scaffold — preserved
api_router.include_router(status.router, prefix="/status", tags=["Status"])

# Health probes under /api/v1/health
api_router.include_router(health.router, prefix="/health", tags=["Health"])

# Core domain endpoint
api_router.include_router(recommendation.router, tags=["Recommendations"])
