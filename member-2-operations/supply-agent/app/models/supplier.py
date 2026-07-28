from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Float, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.supplier_delivery import SupplierDelivery

class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False)
    supplier_rating: Mapped[float] = mapped_column(Float, default=0.0)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    deliveries: Mapped[List["SupplierDelivery"]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan"
    )
