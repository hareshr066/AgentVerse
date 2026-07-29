"""
Production Planning Agent - Response Schema

Defines the structured output returned by the Production Planning Agent
after computing quantity, schedule, capacity utilization, and priority.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Union


class MachineSlot(BaseModel):
    """Represents a single machine's scheduled production allocation."""

    machine: str = Field(
        ...,
        description="Name or identifier of the machine (e.g. 'Machine A').",
        examples=["Machine A"],
    )
    allocated: int = Field(
        ...,
        description="Number of units allocated to this machine.",
        examples=[500],
    )
    machine_id: Optional[str] = Field(
        default=None,
        description="Alias for machine identifier (e.g. 'M-1').",
        examples=["M-1"],
    )
    assigned_units: Optional[int] = Field(
        default=None,
        description="Alias for assigned units.",
        examples=[500],
    )
    capacity: Optional[int] = Field(
        default=None,
        description="Maximum daily capacity of this machine.",
        examples=[500],
    )
    shift_hours: Optional[float] = Field(
        default=8.0,
        description="Total shift hours required for this machine.",
        examples=[8.0],
    )
    utilization_percent: Optional[float] = Field(
        default=100.0,
        description="Percentage of capacity this machine is operating at.",
        examples=[100.0],
    )


class ProductionPlanResponse(BaseModel):
    """
    Full production plan returned by the Production Planning Agent.

    Contains computed quantities, timeline, priority classification,
    capacity metrics, machine schedules, and bottleneck analysis.
    """

    product: Optional[str] = Field(
        default="Air Conditioner",
        description="Product name from the request.",
        examples=["Air Conditioner"],
    )
    production_quantity: int = Field(
        ...,
        description="Total units that need to be produced (forecast_demand - current_inventory + safety_stock).",
        examples=[8800],
    )
    production_days: Union[int, float] = Field(
        ...,
        description="Number of working days required to fulfill the production quantity.",
        examples=[10],
    )
    capacity_utilization: str = Field(
        ...,
        description="Percentage of capacity being used, expressed as a formatted string.",
        examples=["97%"],
    )
    priority: str = Field(
        ...,
        description="Production priority level: CRITICAL | HIGH | NORMAL.",
        examples=["HIGH"],
    )
    machine_schedule: List[MachineSlot] = Field(
        default_factory=list,
        description="Per-machine production allocation schedule.",
    )
    bottlenecks: Optional[List[str]] = Field(
        default=None,
        description="Detected production or supply chain bottlenecks.",
        examples=[["Supplier delay active (4 days)"]],
    )
    optimized_usage: Optional[str] = Field(
        default=None,
        description="Machine usage optimization summary.",
        examples=["Machine allocation balanced across 2 units operating at 97% capacity."],
    )
    message: str = Field(
        default="Production plan generated successfully.",
        description="Status message.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "product": "Air Conditioner",
                "production_quantity": 8800,
                "production_days": 10,
                "capacity_utilization": "97%",
                "priority": "HIGH",
                "machine_schedule": [
                    {
                        "machine": "Machine A",
                        "allocated": 500,
                        "machine_id": "Machine A",
                        "assigned_units": 500,
                    },
                    {
                        "machine": "Machine B",
                        "allocated": 400,
                        "machine_id": "Machine B",
                        "assigned_units": 400,
                    },
                ],
                "bottlenecks": ["Supplier delay active (4 days)"],
                "optimized_usage": "Machine allocation optimized across 2 machines.",
                "message": "Production plan generated successfully.",
            }
        }
    }
