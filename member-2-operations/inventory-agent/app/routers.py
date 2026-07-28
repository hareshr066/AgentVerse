from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.dependencies import get_db
from app.schemas import InventoryCreate, InventoryUpdate, InventoryResponse
from app.models import Inventory
import app.repository as repository
import app.services as services

logger = logging.getLogger("inventory_agent")
router = APIRouter(prefix="/inventory", tags=["Inventory CRUD"])

@router.post("/", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    payload: InventoryCreate,
    db: Session = Depends(get_db)
):
    try:
        existing = repository.get_inventory_by_product_name(db, payload.product_name)
    except Exception as e:
        logger.error("Failed to query inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database query failed."
        )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inventory for product '{payload.product_name}' already exists."
        )
        
    metrics = services.compute_inventory_metrics(
        current_stock=payload.current_stock,
        average_daily_usage=payload.average_daily_usage,
        lead_time=payload.lead_time
    )
    
    db_inventory = Inventory(
        product_name=payload.product_name,
        current_stock=payload.current_stock,
        average_daily_usage=payload.average_daily_usage,
        lead_time=payload.lead_time,
        safety_stock=metrics["safety_stock"],
        reorder_point=metrics["reorder_point"],
        eoq=metrics["eoq"],
        status=metrics["status"]
    )
    
    try:
        return repository.create_inventory(db, db_inventory)
    except Exception as e:
        logger.error("Failed to create inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database write failed."
        )

@router.get("/", response_model=List[InventoryResponse])
def read_all_inventory(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    try:
        return repository.get_all_inventory(db, skip=skip, limit=limit)
    except Exception as e:
        logger.error("Failed to list inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database fetch failed."
        )

@router.get("/{id}", response_model=InventoryResponse)
def read_inventory_by_id(
    id: int,
    db: Session = Depends(get_db)
):
    try:
        db_inventory = repository.get_inventory_by_id(db, id)
    except Exception as e:
        logger.error("Failed to retrieve inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database retrieve failed."
        )
    if not db_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory with ID {id} not found."
        )
    return db_inventory

@router.put("/{id}", response_model=InventoryResponse)
def update_inventory(
    id: int,
    payload: InventoryUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_inventory = repository.get_inventory_by_id(db, id)
    except Exception as e:
        logger.error("Failed to retrieve inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database retrieve failed."
        )
    if not db_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory with ID {id} not found."
        )
        
    update_data = payload.model_dump(exclude_unset=True)
    
    if "product_name" in update_data and update_data["product_name"] != db_inventory.product_name:
        try:
            existing = repository.get_inventory_by_product_name(db, update_data["product_name"])
        except Exception as e:
            logger.error("Failed to query inventory: %s", str(e), exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database query failed."
            )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inventory for product '{update_data['product_name']}' already exists."
            )
            
    calc_keys = {"current_stock", "average_daily_usage", "lead_time"}
    if calc_keys.intersection(update_data.keys()):
        current_stock = update_data.get("current_stock", db_inventory.current_stock)
        average_daily_usage = update_data.get("average_daily_usage", db_inventory.average_daily_usage)
        lead_time = update_data.get("lead_time", db_inventory.lead_time)
        
        metrics = services.compute_inventory_metrics(
            current_stock=current_stock,
            average_daily_usage=average_daily_usage,
            lead_time=lead_time
        )
        update_data.update(metrics)
        
    try:
        return repository.update_inventory(db, db_inventory, update_data)
    except Exception as e:
        logger.error("Failed to update inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database update failed."
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(
    id: int,
    db: Session = Depends(get_db)
):
    try:
        db_inventory = repository.get_inventory_by_id(db, id)
    except Exception as e:
        logger.error("Failed to retrieve inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database retrieve failed."
        )
    if not db_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory with ID {id} not found."
        )
    try:
        repository.delete_inventory(db, db_inventory)
    except Exception as e:
        logger.error("Failed to delete inventory: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database delete failed."
        )
    return None
