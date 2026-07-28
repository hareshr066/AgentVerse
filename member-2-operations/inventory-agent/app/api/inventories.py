from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.dependencies import get_db
from app.models import Inventory
from app.schemas import InventoryCreate, InventoryUpdate, InventoryDB

router = APIRouter(prefix="/inventories", tags=["Inventories"])

@router.post("/", response_model=InventoryDB, status_code=status.HTTP_201_CREATED)
def create_inventory(inventory_in: InventoryCreate, db: Session = Depends(get_db)):
    # Check if inventory for this product already exists
    existing = db.query(Inventory).filter(Inventory.product_name == inventory_in.product_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inventory for product '{inventory_in.product_name}' already exists."
        )
    
    db_inventory = Inventory(**inventory_in.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory

@router.get("/", response_model=List[InventoryDB])
def get_inventories(db: Session = Depends(get_db)):
    return db.query(Inventory).all()

@router.get("/{inventory_id}", response_model=InventoryDB)
def get_inventory(inventory_id: int, db: Session = Depends(get_db)):
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory record not found."
        )
    return db_inventory

@router.put("/{inventory_id}", response_model=InventoryDB)
def update_inventory(inventory_id: int, inventory_in: InventoryUpdate, db: Session = Depends(get_db)):
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory record not found."
        )
    
    update_data = inventory_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_inventory, field, value)
        
    db.commit()
    db.refresh(db_inventory)
    return db_inventory

@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(inventory_id: int, db: Session = Depends(get_db)):
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory record not found."
        )
    db.delete(db_inventory)
    db.commit()
    return None
