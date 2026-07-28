from fastapi import APIRouter

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])

@router.get("/")
def get_deliveries():
    return []
