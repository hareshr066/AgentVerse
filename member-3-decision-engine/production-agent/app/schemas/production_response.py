"""
Production Planning Agent - Response Schema

Defines the structured output returned by the Production Planning Agent
based on PostgreSQL inventory and suppliers database tables.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Union


class MachineSlot(BaseModel):
    """Represents a single machine's scheduled production allocation."""

    machine: str = Field(
        ...,
        description="Name or identifier of the machine.",
        examples=["Machine A"],
    )
    allocated: int = Field(
        ...,
        description="Number of units allocated to this machine.",
        examples=[500],
    )
    machine_id: Optional[str] = Field(
        default=None,
        description="Alias for machine identifier.",
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
    Includes all DB-driven metrics required by the spec.
    """

    product: str = Field(
        ...,
        description="Product Name from inventory table.",
        examples=["Air Conditioner"],
    )
    current_stock: int = Field(
        ...,
        description="Current Stock from inventory table.",
        examples=[4200],
    )
    estimated_demand: int = Field(
        ...,
        description="Estimated Demand = average_daily_usage * lead_time.",
        examples=[3000],
    )
    lead_time: int = Field(
        ...,
        description="Lead Time in days from inventory table.",
        examples=[10],
    )
    safety_stock: int = Field(
        ...,
        description="Safety Stock level from inventory table.",
        examples=[1000],
    )
    reorder_point: int = Field(
        ...,
        description="Reorder Point from inventory table.",
        examples=[2000],
    )
    eoq: float = Field(
        ...,
        description="Economic Order Quantity from inventory table.",
        examples=[1500.0],
    )
    production_quantity: int = Field(
        ...,
        description="Required Production = max(0, Estimated Demand + safety_stock - current_stock).",
        examples=[8800],
    )
    recommended_batch: int = Field(
        ...,
        description="Recommended Batch = max(Required Production, eoq).",
        examples=[8800],
    )
    priority: str = Field(
        ...,
        description="Production Priority: HIGH if current_stock <= reorder_point else NORMAL.",
        examples=["HIGH"],
    )
    inventory_status: str = Field(
        ...,
        description="Inventory Status from inventory table.",
        examples=["LOW"],
    )
    supplier_name: Optional[str] = Field(
        default="Unavailable",
        description="Supplier Name from suppliers table.",
        examples=["AC Acme Supplies"],
    )
    supplier_risk: Optional[str] = Field(
        default="LOW",
        description="Supplier Risk Level from suppliers table.",
        examples=["LOW"],
    )
    supplier_delay: Union[int, bool] = Field(
        default=0,
        description="Delivery delay in days from suppliers table.",
        examples=[4],
    )
    quality_score: Optional[float] = Field(
        default=0.0,
        description="Quality Score from suppliers table.",
        examples=[95.0],
    )
    production_days: Union[int, float] = Field(
        default=0,
        description="Working days required for production run.",
        examples=[10],
    )
    capacity_utilization: str = Field(
        default="100%",
        description="Capacity utilization string.",
        examples=["97%"],
    )
    machine_schedule: List[MachineSlot] = Field(
        default_factory=list,
        description="Per-machine allocation schedule.",
    )
    bottlenecks: Optional[List[str]] = Field(
        default=None,
        description="Bottlenecks analysis.",
    )
    optimized_usage: Optional[str] = Field(
        default=None,
        description="Optimization summary.",
    )
    message: str = Field(
        default="Production plan generated successfully.",
        description="Status message.",
    )
