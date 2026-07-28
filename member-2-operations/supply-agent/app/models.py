from datetime import datetime
from sqlalchemy import Integer, String, Float, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False)
    material_name: Mapped[str] = mapped_column(String(255), nullable=False)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=0)
    price_per_unit: Mapped[float] = mapped_column(Float, default=0.0)
    delivery_delay_days: Mapped[int] = mapped_column(Integer, default=0)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    on_time_delivery_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Calculated Fields
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(50), default="Medium Risk")
    recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
