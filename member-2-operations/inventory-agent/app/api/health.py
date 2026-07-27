from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "service": settings.APP_NAME,
        "status": "healthy",
        "version": settings.APP_VERSION
    }

