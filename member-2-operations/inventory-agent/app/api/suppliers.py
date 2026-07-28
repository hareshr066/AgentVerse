from fastapi import APIRouter

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/")
def get_suppliers():
    return []
