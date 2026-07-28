"""
Recommendation Agent - Request Schema

Aggregates the outputs of the four upstream agents (Event Intelligence,
Demand Forecast, Inventory, Supply Chain, and Production Planning) into a
single payload so the Recommendation Agent can produce a holistic
executive recommendation.

All fields are optional except for the core demand/inventory/production
triplet — the agent must gracefully handle partial data from scenarios
where some upstream agents haven't responded yet.
"""

from pydantic import BaseModel, Field
from typing import Optional


class DemandData(BaseModel):
    """Demand forecast data from Member 1 - Demand Forecast Agent."""

    forecast_demand: int = Field(
        ...,
        gt=0,
        description="Total units forecasted for the planning period.",
        examples=[12000],
    )
    product: str = Field(
        ...,
        min_length=2,
        description="Product name or identifier.",
        examples=["Air Conditioner"],
    )
    forecast_period_days: Optional[int] = Field(
        default=None,
        description="Number of days the forecast covers.",
        examples=[30],
    )


class InventoryData(BaseModel):
    """Inventory data from Member 2 - Inventory Agent."""

    current_inventory: int = Field(
        ...,
        ge=0,
        description="Current units held in inventory.",
        examples=[4500],
    )
    safety_stock: int = Field(
        ...,
        ge=0,
        description="Minimum buffer stock level.",
        examples=[1000],
    )
    reorder_point: Optional[int] = Field(
        default=None,
        description="Stock level at which a replenishment order should be placed.",
        examples=[2000],
    )
    inventory_status: Optional[str] = Field(
        default=None,
        description="Current inventory health: LOW | MEDIUM | HEALTHY.",
        examples=["LOW"],
    )


class SupplyData(BaseModel):
    """Supply chain data from Member 2 - Supply Chain Agent."""

    supplier_delay: bool = Field(
        default=False,
        description="Whether an active supplier delay is present.",
        examples=[True],
    )
    delay_days: int = Field(
        default=0,
        ge=0,
        description="Number of days the supplier is delayed.",
        examples=[4],
    )
    supplier_reliability: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Supplier reliability score between 0.0 (worst) and 1.0 (best).",
        examples=[0.85],
    )


class ProductionData(BaseModel):
    """Production plan data from Member 3 - Production Planning Agent."""

    production_quantity: int = Field(
        ...,
        gt=0,
        description="Total units planned for production.",
        examples=[8500],
    )
    production_days: float = Field(
        ...,
        gt=0,
        description="Duration of the production run in working days.",
        examples=[9.44],
    )
    capacity_utilization: str = Field(
        ...,
        description="Capacity utilization as a formatted percentage string.",
        examples=["100.00%"],
    )
    priority: str = Field(
        ...,
        description="Production priority: CRITICAL | HIGH | NORMAL.",
        examples=["HIGH"],
    )


class RecommendationRequest(BaseModel):
    """
    Full input payload for the Recommendation Agent.

    Combines outputs from all upstream agents into one request body.
    At minimum, demand, inventory, and production sub-objects are required.
    Supply data is optional to allow the agent to operate even when the
    Supply Chain Agent hasn't responded.
    """

    demand: DemandData = Field(
        ...,
        description="Demand forecast data from the Demand Forecast Agent.",
    )
    inventory: InventoryData = Field(
        ...,
        description="Inventory state from the Inventory Agent.",
    )
    supply: Optional[SupplyData] = Field(
        default=None,
        description="Supply chain status from the Supply Chain Agent (optional).",
    )
    production: ProductionData = Field(
        ...,
        description="Production plan from the Production Planning Agent.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "demand": {
                    "product": "Air Conditioner",
                    "forecast_demand": 12000,
                    "forecast_period_days": 30,
                },
                "inventory": {
                    "current_inventory": 4500,
                    "safety_stock": 1000,
                    "reorder_point": 2000,
                    "inventory_status": "LOW",
                },
                "supply": {
                    "supplier_delay": True,
                    "delay_days": 4,
                    "supplier_reliability": 0.85,
                },
                "production": {
                    "production_quantity": 8500,
                    "production_days": 9.44,
                    "capacity_utilization": "100.00%",
                    "priority": "HIGH",
                },
            }
        }
    }
