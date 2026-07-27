from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "service": "Supply Chain Agent",
        "status": "healthy"
    }
