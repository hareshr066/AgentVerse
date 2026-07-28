from fastapi import APIRouter, HTTPException, status
from app.schemas import InventoryRequest, LegacyInventoryResponse
from app.services import InventoryService
from app.core import logger, InventoryCalculationError

router = APIRouter(tags=["Inventory"])

@router.post("/inventory/calculate", response_model=LegacyInventoryResponse)
def calculate_inventory(request: InventoryRequest) -> LegacyInventoryResponse:
    try:
        service = InventoryService()
        return service.calculate_inventory(request)
    except InventoryCalculationError as e:
        logger.error("Inventory calculation failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Unexpected error during inventory calculation: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during inventory calculation."
        )



