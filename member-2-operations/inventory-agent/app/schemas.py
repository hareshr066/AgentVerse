from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

# --- Legacy Calculation Schemas ---
class InventoryRequest(BaseModel):
    product: str = Field(..., description="Name of the product")
    forecast_demand: int = Field(..., ge=0, description="Forecasted demand")
    current_stock: int = Field(..., ge=0, description="Current stock level")
    daily_demand: int = Field(..., ge=0, description="Daily demand rate")
    lead_time: int = Field(..., ge=0, description="Lead time in days")
    ordering_cost: Optional[float] = Field(500.0, ge=0.0, description="Default ordering cost")
    holding_cost: Optional[float] = Field(50.0, ge=0.0, description="Default holding cost")

class LegacyInventoryResponse(BaseModel):
    product: str
    current_stock: int
    safety_stock: int
    reorder_point: int
    inventory_status: str
    economic_order_quantity: int
    message: str

# --- New CRUD Schemas ---
class InventoryCreate(BaseModel):
    product_name: str = Field(..., description="Name of the product")
    current_stock: int = Field(..., ge=0, description="Current stock level")
    average_daily_usage: float = Field(..., ge=0.0, description="Average daily usage")
    lead_time: int = Field(..., ge=0, description="Lead time in days")

    @field_validator("product_name")
    @classmethod
    def validate_product_name(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Product name cannot be empty or whitespace only.")
        return value.strip()

class InventoryUpdate(BaseModel):
    product_name: Optional[str] = Field(None, description="Name of the product")
    current_stock: Optional[int] = Field(None, ge=0, description="Current stock level")
    average_daily_usage: Optional[float] = Field(None, ge=0.0, description="Average daily usage")
    lead_time: Optional[int] = Field(None, ge=0, description="Lead time in days")

    @field_validator("product_name")
    @classmethod
    def validate_product_name(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not value or not value.strip():
                raise ValueError("Product name cannot be empty or whitespace only.")
            return value.strip()
        return value

class InventoryResponse(BaseModel):
    id: int
    product_name: str
    current_stock: int
    average_daily_usage: float
    lead_time: int
    safety_stock: float
    reorder_point: float
    eoq: float
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# Alias for backward compatibility with old inventories router
InventoryDB = InventoryResponse
