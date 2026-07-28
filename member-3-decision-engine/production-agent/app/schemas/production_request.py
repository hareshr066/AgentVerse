"""
Production Planning Agent - Request Schema

Validates incoming production plan requests from the orchestrator
or other agents. All fields are typed and documented for Swagger.
"""

from pydantic import BaseModel, Field, model_validator
from typing import Optional


class ProductionPlanRequest(BaseModel):
    """
    Input payload for the Production Planning Agent.

    Carries demand forecast data, current inventory state, and
    operational parameters needed to compute a production plan.
    """

    product: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Name or identifier of the product to be manufactured.",
        examples=["Air Conditioner"],
    )
    forecast_demand: int = Field(
        ...,
        gt=0,
        description="Total units expected to be demanded in the planning period.",
        examples=[12000],
    )
    current_inventory: int = Field(
        ...,
        ge=0,
        description="Units currently held in inventory before production starts.",
        examples=[4500],
    )
    safety_stock: int = Field(
        ...,
        ge=0,
        description="Minimum buffer stock to maintain to cover demand variability.",
        examples=[1000],
    )
    supplier_delay: bool = Field(
        default=False,
        description="Indicates whether there is an active supplier delay.",
        examples=[True],
    )
    delay_days: int = Field(
        default=0,
        ge=0,
        description="Number of days the supplier is delayed. Relevant only when supplier_delay is True.",
        examples=[4],
    )
    daily_capacity: int = Field(
        ...,
        gt=0,
        description="Maximum number of units the facility can produce per day.",
        examples=[900],
    )
    num_machines: Optional[int] = Field(
        default=3,
        gt=0,
        description="Number of production machines available for scheduling.",
        examples=[3],
    )

    @model_validator(mode="after")
    def validate_delay_consistency(self) -> "ProductionPlanRequest":
        """If supplier_delay is True, delay_days must be greater than zero."""
        if self.supplier_delay and self.delay_days == 0:
            raise ValueError(
                "delay_days must be greater than 0 when supplier_delay is True."
            )
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "product": "Air Conditioner",
                "forecast_demand": 12000,
                "current_inventory": 4500,
                "safety_stock": 1000,
                "supplier_delay": True,
                "delay_days": 4,
                "daily_capacity": 900,
                "num_machines": 3,
            }
        }
    }
