"""
Production Planning Agent - Response Schema

Defines the structured output returned by the Production Planning Agent
after computing quantity, schedule, capacity utilization, and priority.
"""

from pydantic import BaseModel, Field
from typing import List


class MachineSlot(BaseModel):
    """Represents a single machine's scheduled production window."""

    machine_id: str = Field(
        ...,
        description="Unique identifier for the machine (e.g., 'M-1').",
        examples=["M-1"],
    )
    assigned_units: int = Field(
        ...,
        description="Number of units assigned to this machine.",
        examples=[2900],
    )
    shift_hours: float = Field(
        ...,
        description="Total shift hours required for this machine to complete its allocation.",
        examples=[8.0],
    )
    utilization_percent: float = Field(
        ...,
        description="Percentage of maximum capacity this machine is operating at.",
        examples=[96.7],
    )


class ProductionPlanResponse(BaseModel):
    """
    Full production plan returned by the Production Planning Agent.

    Contains computed quantities, timeline, priority classification,
    capacity metrics, and individual machine schedules.
    """

    product: str = Field(
        ...,
        description="Product name from the original request.",
        examples=["Air Conditioner"],
    )
    production_quantity: int = Field(
        ...,
        description="Total units that need to be produced (forecast_demand - current_inventory + safety_stock).",
        examples=[8500],
    )
    production_days: float = Field(
        ...,
        description="Number of working days required to fulfil the production quantity at given daily capacity.",
        examples=[9.44],
    )
    capacity_utilization: str = Field(
        ...,
        description="Percentage of capacity being used, expressed as a formatted string.",
        examples=["100.00%"],
    )
    priority: str = Field(
        ...,
        description="Production priority level: CRITICAL | HIGH | NORMAL.",
        examples=["HIGH"],
    )
    machine_schedule: List[MachineSlot] = Field(
        default_factory=list,
        description="Per-machine production schedule showing unit allocation and shift hours.",
    )
    message: str = Field(
        default="Production plan generated successfully.",
        description="Human-readable status message.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "product": "Air Conditioner",
                "production_quantity": 8500,
                "production_days": 9.44,
                "capacity_utilization": "100.00%",
                "priority": "HIGH",
                "machine_schedule": [
                    {
                        "machine_id": "M-1",
                        "assigned_units": 2834,
                        "shift_hours": 8.0,
                        "utilization_percent": 100.0,
                    },
                    {
                        "machine_id": "M-2",
                        "assigned_units": 2833,
                        "shift_hours": 8.0,
                        "utilization_percent": 100.0,
                    },
                    {
                        "machine_id": "M-3",
                        "assigned_units": 2833,
                        "shift_hours": 8.0,
                        "utilization_percent": 100.0,
                    },
                ],
                "message": "Production plan generated successfully.",
            }
        }
    }
