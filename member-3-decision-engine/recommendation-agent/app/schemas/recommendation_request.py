"""
Recommendation Agent - Request Schema

Aggregates outputs from the four upstream agents (Demand Forecast,
Inventory, Supply Chain, and Production Planning) into a single payload
so the Recommendation Agent can produce a holistic executive recommendation.

Supports both flat and nested JSON payloads gracefully.
"""

from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any


class DemandData(BaseModel):
    """Demand forecast data."""

    product: str = Field(
        default="Air Conditioner",
        description="Product name or identifier.",
        examples=["Air Conditioner"],
    )
    forecast_demand: int = Field(
        ...,
        ge=0,
        description="Total units forecasted for the planning period.",
        examples=[12000],
    )
    forecast_period_days: Optional[int] = Field(
        default=30,
        description="Number of days the forecast covers.",
        examples=[30],
    )


class InventoryData(BaseModel):
    """Inventory data."""

    current_inventory: int = Field(
        ...,
        ge=0,
        description="Current units held in inventory.",
        examples=[4000],
    )
    safety_stock: int = Field(
        default=1000,
        ge=0,
        description="Minimum buffer stock level.",
        examples=[1000],
    )
    reorder_point: Optional[int] = Field(
        default=2000,
        description="Stock level at which a replenishment order should be placed.",
        examples=[2000],
    )
    inventory_status: Optional[str] = Field(
        default=None,
        description="Current inventory health: LOW | MEDIUM | HEALTHY.",
        examples=["LOW"],
    )


class SupplyData(BaseModel):
    """Supply chain data."""

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
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Supplier reliability score.",
        examples=[0.85],
    )


class ProductionData(BaseModel):
    """Production plan data."""

    production_quantity: int = Field(
        ...,
        ge=0,
        description="Total units planned for production.",
        examples=[9000],
    )
    production_days: float = Field(
        default=10.0,
        ge=0,
        description="Duration of the production run in working days.",
        examples=[10.0],
    )
    capacity_utilization: str = Field(
        default="97%",
        description="Capacity utilization string.",
        examples=["97%"],
    )
    priority: str = Field(
        default="HIGH",
        description="Production priority: CRITICAL | HIGH | NORMAL.",
        examples=["HIGH"],
    )


class RecommendationRequest(BaseModel):
    """
    Full input payload for the Recommendation Agent.

    Supports both flat JSON bodies (e.g. {"forecast": 12000, "inventory": 4000, ...})
    and nested JSON bodies (e.g. {"demand": {...}, "inventory": {...}, ...}).
    """

    demand: DemandData = Field(
        ...,
        description="Demand forecast data.",
    )
    inventory: InventoryData = Field(
        ...,
        description="Inventory state.",
    )
    supply: SupplyData = Field(
        default_factory=SupplyData,
        description="Supply chain status.",
    )
    production: ProductionData = Field(
        ...,
        description="Production plan data.",
    )

    @model_validator(mode="before")
    @classmethod
    def preprocess_payload(cls, data: Any) -> Any:
        """
        Normalize flat payload inputs into the nested structure.
        """
        if not isinstance(data, dict):
            return data

        product = data.get("product") or "Air Conditioner"
        forecast = data.get("forecast") if data.get("forecast") is not None else data.get("forecast_demand")

        # Normalize Demand
        if "demand" not in data or not isinstance(data["demand"], dict):
            f_val = forecast if forecast is not None else 12000
            data["demand"] = {
                "product": product,
                "forecast_demand": f_val,
                "forecast_period_days": data.get("forecast_period_days", 30),
            }
        else:
            if "forecast_demand" not in data["demand"] and forecast is not None:
                data["demand"]["forecast_demand"] = forecast
            if "product" not in data["demand"]:
                data["demand"]["product"] = product

        # Normalize Inventory
        inv_val = data.get("inventory") if isinstance(data.get("inventory"), int) else data.get("current_inventory")
        if "inventory" not in data or not isinstance(data["inventory"], dict):
            i_val = inv_val if inv_val is not None else 4000
            s_val = data.get("safety_stock", 1000)
            data["inventory"] = {
                "current_inventory": i_val,
                "safety_stock": s_val,
                "reorder_point": data.get("reorder_point", 2000),
                "inventory_status": data.get("inventory_status"),
            }
        else:
            if "current_inventory" not in data["inventory"] and inv_val is not None:
                data["inventory"]["current_inventory"] = inv_val

        # Normalize Supply
        if "supply" not in data or not isinstance(data["supply"], dict):
            data["supply"] = {
                "supplier_delay": data.get("supplier_delay", False),
                "delay_days": data.get("delay_days", 0),
                "supplier_reliability": data.get("supplier_reliability", 0.85),
            }

        # Normalize Production
        prod_qty = data.get("production_quantity")
        if isinstance(data.get("production"), int):
            prod_qty = data["production"]

        if "production" not in data or not isinstance(data["production"], dict):
            p_val = prod_qty if prod_qty is not None else 9000
            data["production"] = {
                "production_quantity": p_val,
                "production_days": data.get("production_days", 10.0),
                "capacity_utilization": data.get("capacity_utilization", "97%"),
                "priority": data.get("priority", "HIGH"),
            }
        else:
            if "production_quantity" not in data["production"] and prod_qty is not None:
                data["production"]["production_quantity"] = prod_qty

        return data

    model_config = {
        "json_schema_extra": {
            "example": {
                "forecast": 12000,
                "inventory": 4000,
                "supplier_delay": True,
                "production_quantity": 9000,
            }
        }
    }
