from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Inventory

def create_inventory(db: Session, db_inventory: Inventory) -> Inventory:
    try:
        db.add(db_inventory)
        db.commit()
        db.refresh(db_inventory)
        return db_inventory
    except Exception:
        db.rollback()
        raise

def get_inventory_by_id(db: Session, inventory_id: int) -> Optional[Inventory]:
    return db.query(Inventory).filter(Inventory.id == inventory_id).first()

def get_inventory_by_product_name(db: Session, product_name: str) -> Optional[Inventory]:
    return db.query(Inventory).filter(Inventory.product_name == product_name).first()

def get_all_inventory(db: Session, skip: int = 0, limit: int = 100) -> List[Inventory]:
    return db.query(Inventory).offset(skip).limit(limit).all()

def update_inventory(db: Session, db_inventory: Inventory, update_data: dict) -> Inventory:
    try:
        for key, value in update_data.items():
            setattr(db_inventory, key, value)
        db.commit()
        db.refresh(db_inventory)
        return db_inventory
    except Exception:
        db.rollback()
        raise

def delete_inventory(db: Session, db_inventory: Inventory) -> bool:
    try:
        db.delete(db_inventory)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
