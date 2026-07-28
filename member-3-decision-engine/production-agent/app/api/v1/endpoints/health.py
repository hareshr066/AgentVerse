"""
Production Planning Agent - Health endpoints

GET /         → welcome message (root)
GET /health   → liveness probe for orchestrator / load balancer
"""

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get(
    "/",
    summary="Root",
    description="Welcome message confirming the Production Planning Agent is reachable.",
    tags=["Health"],
)
async def root() -> dict:
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "message": f"Welcome to {settings.PROJECT_NAME}",
    }


@router.get(
    "/health",
    summary="Health check",
    description="Lightweight liveness probe — returns 200 OK when the service is running.",
    tags=["Health"],
)
async def health_check() -> dict:
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
