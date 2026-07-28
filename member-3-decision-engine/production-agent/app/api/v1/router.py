"""
Production Planning Agent - API v1 Router

Aggregates all endpoint routers under the /api/v1 prefix.
Add new endpoint modules here to keep main.py clean.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import status
from app.api.v1.endpoints import health
from app.api.v1.endpoints import production

api_router = APIRouter()

# Liveness / status (existing scaffold — preserved)
api_router.include_router(status.router, prefix="/status", tags=["Status"])

# Health probes (GET / and GET /health live at the app root — included without prefix)
# They are registered on the FastAPI app directly in main.py; this router
# exposes them under /api/v1/health for internal service-mesh probing.
api_router.include_router(health.router, prefix="/health", tags=["Health"])

# Core domain endpoint
api_router.include_router(production.router, tags=["Production Planning"])
