from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class SupplierCreate(BaseModel):
    supplier_name: str = Field(..., description="Name of the supplier")
    material_name: str = Field(..., description="Name of the material supplied")
    available_quantity: int = Field(..., ge=0, description="Available quantity of material")
    lead_time_days: int = Field(..., ge=0, description="Lead time in days")
    price_per_unit: float = Field(..., gt=0.0, description="Price per unit, must be greater than 0")
    delivery_delay_days: int = Field(..., ge=0, description="Delivery delay in days")
    quality_score: float = Field(..., ge=0.0, le=100.0, description="Quality score between 0 and 100")
    on_time_delivery_percentage: float = Field(..., ge=0.0, le=100.0, description="On-time delivery percentage between 0 and 100")

    @field_validator("supplier_name", "material_name")
    @classmethod
    def validate_non_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Field cannot be empty or whitespace only.")
        return value.strip()

class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = Field(None, description="Name of the supplier")
    material_name: Optional[str] = Field(None, description="Name of the material supplied")
    available_quantity: Optional[int] = Field(None, ge=0, description="Available quantity of material")
    lead_time_days: Optional[int] = Field(None, ge=0, description="Lead time in days")
    price_per_unit: Optional[float] = Field(None, gt=0.0, description="Price per unit, must be greater than 0")
    delivery_delay_days: Optional[int] = Field(None, ge=0, description="Delivery delay in days")
    quality_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Quality score between 0 and 100")
    on_time_delivery_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, description="On-time delivery percentage between 0 and 100")

    @field_validator("supplier_name", "material_name")
    @classmethod
    def validate_non_empty(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not value or not value.strip():
                raise ValueError("Field cannot be empty or whitespace only.")
            return value.strip()
        return value

class SupplierResponse(BaseModel):
    id: int
    supplier_name: str
    material_name: str
    available_quantity: int
    lead_time_days: int
    price_per_unit: float
    delivery_delay_days: int
    quality_score: float
    on_time_delivery_percentage: float
    risk_score: float
    risk_level: str
    recommended: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
