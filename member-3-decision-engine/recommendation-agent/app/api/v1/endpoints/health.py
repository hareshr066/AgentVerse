"""
Recommendation Agent - Health endpoints

GET /         → welcome message
GET /health   → liveness probe
"""

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/", summary="Welcome", tags=["Health"])
async def root() -> dict:
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "message": f"Welcome to {settings.PROJECT_NAME}",
    }


@router.get("/health", summary="Health check", tags=["Health"])
async def health_check() -> dict:
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
