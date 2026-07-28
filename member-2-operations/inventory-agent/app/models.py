from datetime import datetime
from typing import List, Optional
from sqlalchemy import Integer, String, Float, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    deliveries: Mapped[List["SupplierDelivery"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


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


class Inventory(Base):
    __tablename__ = "inventories"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    average_daily_usage: Mapped[float] = mapped_column(Float, default=0.0)
    lead_time: Mapped[int] = mapped_column(Integer, default=0)
    safety_stock: Mapped[float] = mapped_column(Float, default=0.0)
    reorder_point: Mapped[float] = mapped_column(Float, default=0.0)
    eoq: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="IN_STOCK")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
