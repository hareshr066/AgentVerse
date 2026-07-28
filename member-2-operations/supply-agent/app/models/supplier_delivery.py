from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier
    from app.models.product import Product

class SupplierDelivery(Base):
    __tablename__ = "supplier_deliveries"

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    expected_delivery_days: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_delivery_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    delivery_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivery_status: Mapped[str] = mapped_column(String(50), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    supplier: Mapped["Supplier"] = relationship(back_populates="deliveries")
    product: Mapped["Product"] = relationship(back_populates="deliveries")
