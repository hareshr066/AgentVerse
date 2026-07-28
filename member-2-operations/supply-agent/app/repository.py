from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Supplier

def create_supplier(db: Session, db_supplier: Supplier) -> Supplier:
    try:
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except Exception:
        db.rollback()
        raise

def get_supplier_by_id(db: Session, supplier_id: int) -> Optional[Supplier]:
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()

def get_all_suppliers(db: Session, skip: int = 0, limit: int = 100) -> List[Supplier]:
    return db.query(Supplier).offset(skip).limit(limit).all()

def get_recommended_suppliers(db: Session) -> List[Supplier]:
    return db.query(Supplier).filter(Supplier.recommended == True).all()

def get_high_risk_suppliers(db: Session) -> List[Supplier]:
    return db.query(Supplier).filter(Supplier.risk_level.in_(["High Risk", "Critical"])).all()

def update_supplier(db: Session, db_supplier: Supplier, update_data: dict) -> Supplier:
    try:
        for key, value in update_data.items():
            setattr(db_supplier, key, value)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except Exception:
        db.rollback()
        raise

def delete_supplier(db: Session, db_supplier: Supplier) -> bool:
    try:
        db.delete(db_supplier)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
