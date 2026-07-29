from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.schemas import InventoryRequest, LegacyInventoryResponse, InventoryDB
from app.services import InventoryService, compute_inventory_metrics
from app.core import logger, InventoryCalculationError
from app.dependencies import get_db
from app.models import Inventory
import urllib.request
import json
from app.config import settings

router = APIRouter(tags=["Inventory"])

class InventoryCreateItem(BaseModel):
    product_name: str
    current_stock: int
    average_daily_usage: float
    lead_time: int

def sync_item_to_neon(product_name, current_stock, usage, lead_time, safety, reorder, eoq, status_str):
    """Sync item to Neon cloud database via HTTPS (Port 443)."""
    neon_url = "https://ep-withered-shape-axrygj8o.c-4.us-east-2.aws.neon.tech/sql"
    headers = {
        "Neon-Connection-String": settings.DATABASE_URL,
        "Content-Type": "application/json"
    }
    sql = f"""
    INSERT INTO inventories (product_name, current_stock, average_daily_usage, lead_time, safety_stock, reorder_point, eoq, status)
    VALUES ('{product_name}', {current_stock}, {usage}, {lead_time}, {safety}, {reorder}, {eoq}, '{status_str}')
    ON CONFLICT (product_name) DO UPDATE SET
        current_stock = EXCLUDED.current_stock,
        average_daily_usage = EXCLUDED.average_daily_usage,
        lead_time = EXCLUDED.lead_time,
        safety_stock = EXCLUDED.safety_stock,
        reorder_point = EXCLUDED.reorder_point,
        eoq = EXCLUDED.eoq,
        status = EXCLUDED.status;
    """
    try:
        req = urllib.request.Request(neon_url, data=json.dumps({"query": sql}).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=4) as resp:
            pass
    except Exception as e:
        logger.warning("Neon cloud sync warning: %s", str(e))

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

@router.post("/inventory/", response_model=InventoryDB, status_code=status.HTTP_201_CREATED)
def create_or_update_inventory(item: InventoryCreateItem, db: Session = Depends(get_db)):
    """Add or update an inventory material, calculate metrics, and save to DB."""
    try:
        metrics = compute_inventory_metrics(
            current_stock=item.current_stock,
            average_daily_usage=item.average_daily_usage,
            lead_time=item.lead_time
        )
        
        db_item = db.query(Inventory).filter(Inventory.product_name == item.product_name).first()
        if not db_item:
            db_item = Inventory(
                product_name=item.product_name,
                current_stock=item.current_stock,
                average_daily_usage=item.average_daily_usage,
                lead_time=item.lead_time,
                safety_stock=metrics["safety_stock"],
                reorder_point=metrics["reorder_point"],
                eoq=metrics["eoq"],
                status=metrics["status"]
            )
            db.add(db_item)
        else:
            db_item.current_stock = item.current_stock
            db_item.average_daily_usage = item.average_daily_usage
            db_item.lead_time = item.lead_time
            db_item.safety_stock = metrics["safety_stock"]
            db_item.reorder_point = metrics["reorder_point"]
            db_item.eoq = metrics["eoq"]
            db_item.status = metrics["status"]
            
        db.commit()
        db.refresh(db_item)
        
        sync_item_to_neon(
            db_item.product_name, db_item.current_stock, db_item.average_daily_usage,
            db_item.lead_time, db_item.safety_stock, db_item.reorder_point, db_item.eoq, db_item.status
        )
        
        return db_item
    except Exception as e:
        logger.error("Failed to save inventory item: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inventory/recalculate")
def recalculate_all_inventory(db: Session = Depends(get_db)):
    """Recalculate EOQ, ROP, Safety Stock, and Status for all database records."""
    try:
        items = db.query(Inventory).all()
        updated = []
        for item in items:
            metrics = compute_inventory_metrics(
                current_stock=item.current_stock,
                average_daily_usage=item.average_daily_usage,
                lead_time=item.lead_time
            )
            item.safety_stock = metrics["safety_stock"]
            item.reorder_point = metrics["reorder_point"]
            item.eoq = metrics["eoq"]
            item.status = metrics["status"]
            updated.append(item.product_name)
            
            sync_item_to_neon(
                item.product_name, item.current_stock, item.average_daily_usage,
                item.lead_time, item.safety_stock, item.reorder_point, item.eoq, item.status
            )
            
        db.commit()
        return {"status": "success", "recalculated_items": len(updated), "items": updated}
    except Exception as e:
        logger.error("Failed recalculating inventory: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

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
