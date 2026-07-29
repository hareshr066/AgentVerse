"""
Production Planning Agent - Request Schema

Validates incoming production plan requests from the orchestrator
or other agents. All fields are typed and documented for Swagger.
"""

from pydantic import BaseModel, Field, model_validator
from typing import Optional, List


class MachineInput(BaseModel):
    """Input specification for an individual machine."""

    name: str = Field(
        ...,
        description="Name or identifier of the machine (e.g. 'Machine A').",
        examples=["Machine A"],
    )
    capacity: int = Field(
        ...,
        gt=0,
        description="Daily manufacturing capacity of this machine.",
        examples=[500],
    )


class ProductionPlanRequest(BaseModel):
    """
    Input payload for the Production Planning Agent.

    Carries demand forecast data, current inventory state, machine capacities,
    and operational parameters needed to compute a production plan.
    """

    product: str = Field(
        default="Air Conditioner",
        description="Name or identifier of the product to be manufactured.",
        examples=["Air Conditioner"],
    )
    forecast_demand: int = Field(
        ...,
        ge=0,
        description="Total units expected to be demanded in the planning period.",
        examples=[12000],
    )
    current_inventory: int = Field(
        ...,
        ge=0,
        description="Units currently held in inventory before production starts.",
        examples=[4200],
    )
    safety_stock: int = Field(
        default=1000,
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
        description="Number of days the supplier is delayed. Relevant when supplier_delay is True.",
        examples=[4],
    )
    daily_capacity: int = Field(
        default=900,
        gt=0,
        description="Maximum number of units the facility can produce per day.",
        examples=[900],
    )
    machines: Optional[List[MachineInput]] = Field(
        default=None,
        description="Optional explicit list of available machines and their daily capacities.",
        examples=[
            [
                {"name": "Machine A", "capacity": 500},
                {"name": "Machine B", "capacity": 400},
            ]
        ],
    )
    num_machines: Optional[int] = Field(
        default=None,
        gt=0,
        description="Number of production machines available for scheduling if machines list is omitted.",
        examples=[2],
    )

    @model_validator(mode="after")
    def validate_delay_consistency(self) -> "ProductionPlanRequest":
        """Ensure delay_days is greater than 0 if supplier_delay is True."""
        if self.supplier_delay and self.delay_days == 0:
            # Set default delay_days to 1 if supplier_delay is True but delay_days was 0
            self.delay_days = 1
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "product": "Air Conditioner",
                "forecast_demand": 12000,
                "current_inventory": 4200,
                "safety_stock": 1000,
                "supplier_delay": True,
                "delay_days": 4,
                "daily_capacity": 900,
                "machines": [
                    {"name": "Machine A", "capacity": 500},
                    {"name": "Machine B", "capacity": 400},
                ],
            }
        }
    }
