from pydantic import BaseModel, Field
from app.config import settings

class InventoryRequest(BaseModel):
    product: str = Field(
        ...,
        min_length=2,
        description="Unique name or identifier of the product",
        examples=["Widget A"]
    )
    forecast_demand: int = Field(
        ...,
        gt=0,
        description="Forecasted annual demand for the product",
        examples=[100]
    )
    current_stock: int = Field(
        ...,
        ge=0,
        description="Current physical inventory level in stock",
        examples=[50]
    )
    daily_demand: int = Field(
        ...,
        gt=0,
        description="Average daily demand rate",
        examples=[5]
    )
    lead_time: int = Field(
        ...,
        gt=0,
        description="Supplier lead time in days to fulfill an order",
        examples=[3]
    )
    ordering_cost: float = Field(
        default=settings.DEFAULT_ORDERING_COST,
        gt=0,
        description="Cost to place a single order",
        examples=[settings.DEFAULT_ORDERING_COST]
    )
    holding_cost: float = Field(
        default=settings.DEFAULT_HOLDING_COST,
        gt=0,
        description="Annual holding/carrying cost per unit of inventory",
        examples=[settings.DEFAULT_HOLDING_COST]
    )
