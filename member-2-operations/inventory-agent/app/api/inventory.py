from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List
from app.schemas import InventoryRequest, LegacyInventoryResponse, InventoryDB
from app.services import InventoryService
from app.core import logger, InventoryCalculationError
from app.dependencies import get_db
from app.models import Inventory

router = APIRouter(tags=["Inventory"])

@router.get("/inventory/", response_model=List[InventoryDB])
def list_inventory(db: Session = Depends(get_db)):
    """Return all inventory records — used by the frontend dashboard."""
    try:
        return db.query(Inventory).all()
    except Exception as e:
        logger.error("Failed to list inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve inventory records."
        )

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
