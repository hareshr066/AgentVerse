from sqlalchemy import Column, Integer, String, JSON
from app.core.database import Base

class ProductionPlan(Base):
    __tablename__ = "production_plans"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=100)
    status = Column(String(50), default="PLANNED")
    materials_needed = Column(JSON, nullable=True)
