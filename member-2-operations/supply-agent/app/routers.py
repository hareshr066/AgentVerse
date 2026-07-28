from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.dependencies import get_db
from app.schemas import SupplierCreate, SupplierUpdate, SupplierResponse
from app.models import Supplier
import app.repository as repository
import app.services as services

logger = logging.getLogger("supply_agent")
router = APIRouter(prefix="/suppliers", tags=["Supplier CRUD"])

@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db)
):
    metrics = services.calculate_supplier_metrics(
        delivery_delay_days=payload.delivery_delay_days,
        lead_time_days=payload.lead_time_days,
        quality_score=payload.quality_score,
        on_time_delivery_percentage=payload.on_time_delivery_percentage
    )
    
    db_supplier = Supplier(
        supplier_name=payload.supplier_name,
        material_name=payload.material_name,
        available_quantity=payload.available_quantity,
        lead_time_days=payload.lead_time_days,
        price_per_unit=payload.price_per_unit,
        delivery_delay_days=payload.delivery_delay_days,
        quality_score=payload.quality_score,
        on_time_delivery_percentage=payload.on_time_delivery_percentage,
        risk_score=metrics["risk_score"],
        risk_level=metrics["risk_level"],
        recommended=metrics["recommended"]
    )
    
    try:
        return repository.create_supplier(db, db_supplier)
    except Exception as e:
        logger.error("Failed to create supplier: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database write failed."
        )

@router.get("/", response_model=List[SupplierResponse])
def read_all_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    try:
        return repository.get_all_suppliers(db, skip=skip, limit=limit)
    except Exception as e:
        logger.error("Failed to list suppliers: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database fetch failed."
        )

@router.get("/recommended", response_model=List[SupplierResponse])
def read_recommended_suppliers(
    db: Session = Depends(get_db)
):
    try:
        return repository.get_recommended_suppliers(db)
    except Exception as e:
        logger.error("Failed to fetch recommended suppliers: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database query failed."
        )

@router.get("/high-risk", response_model=List[SupplierResponse])
def read_high_risk_suppliers(
    db: Session = Depends(get_db)
):
    try:
        return repository.get_high_risk_suppliers(db)
    except Exception as e:
        logger.error("Failed to fetch high risk suppliers: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database query failed."
        )

@router.get("/{id}", response_model=SupplierResponse)
def read_supplier_by_id(
    id: int,
    db: Session = Depends(get_db)
):
    try:
        db_supplier = repository.get_supplier_by_id(db, id)
    except Exception as e:
        logger.error("Failed to retrieve supplier: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database retrieve failed."
        )
    if not db_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {id} not found."
        )
    return db_supplier

@router.put("/{id}", response_model=SupplierResponse)
def update_supplier(
    id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_supplier = repository.get_supplier_by_id(db, id)
    except Exception as e:
        logger.error("Failed to retrieve supplier: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database retrieve failed."
        )
    if not db_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {id} not found."
        )
        
    update_data = payload.model_dump(exclude_unset=True)
    
    # Recalculate metrics if any factor changed
    calc_keys = {"delivery_delay_days", "lead_time_days", "quality_score", "on_time_delivery_percentage"}
    if calc_keys.intersection(update_data.keys()):
        delivery_delay_days = update_data.get("delivery_delay_days", db_supplier.delivery_delay_days)
        lead_time_days = update_data.get("lead_time_days", db_supplier.lead_time_days)
        quality_score = update_data.get("quality_score", db_supplier.quality_score)
        on_time_delivery_percentage = update_data.get("on_time_delivery_percentage", db_supplier.on_time_delivery_percentage)
        
        metrics = services.calculate_supplier_metrics(
            delivery_delay_days=delivery_delay_days,
            lead_time_days=lead_time_days,
            quality_score=quality_score,
            on_time_delivery_percentage=on_time_delivery_percentage
        )
        update_data.update(metrics)
        
    try:
        return repository.update_supplier(db, db_supplier, update_data)
    except Exception as e:
        logger.error("Failed to update supplier: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database update failed."
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    id: int,
    db: Session = Depends(get_db)
):
    try:
        db_supplier = repository.get_supplier_by_id(db, id)
    except Exception as e:
        logger.error("Failed to retrieve supplier: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database retrieve failed."
        )
    if not db_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {id} not found."
        )
    try:
        repository.delete_supplier(db, db_supplier)
    except Exception as e:
        logger.error("Failed to delete supplier: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database delete failed."
        )
    return None
