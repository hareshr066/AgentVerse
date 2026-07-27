from fastapi import APIRouter
from app.schemas import SupplyRequest, SupplyResponse
from app.services import SupplyService

router = APIRouter(tags=["Supply Chain"])

@router.post("/supply/analyze", response_model=SupplyResponse)
def analyze_supply(request: SupplyRequest) -> SupplyResponse:
    service = SupplyService()
    return service.analyze_supplier(request)
