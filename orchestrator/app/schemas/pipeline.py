from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PipelineRequest(BaseModel):
    product_id: str = Field(default="PROD-101", description="Product ID or product name")
    city: Optional[str] = Field(default="Delhi", description="City location for event & weather telemetry")
    current_stock: Optional[int] = Field(default=150, description="Current physical inventory level")
    daily_demand: Optional[int] = Field(default=5, description="Average daily demand rate")
    lead_time: Optional[int] = Field(default=3, description="Supplier lead time in days")
    sales_history: Optional[List[float]] = Field(
        default_factory=lambda: [100.0, 110.0, 105.0, 120.0, 130.0],
        description="Historical sales data"
    )

class PipelineResponse(BaseModel):
    status: str = Field(..., description="Overall pipeline status ('success' or 'degraded')")
    product_id: str = Field(..., description="Product ID evaluated")
    city: str = Field(..., description="City location")
    event_data: Dict[str, Any] = Field(..., description="Output from Event Agent")
    demand_data: Dict[str, Any] = Field(..., description="Output from Demand Agent")
    inventory_data: Dict[str, Any] = Field(..., description="Output from Operations/Inventory Agent")
    decision_recommendation: Dict[str, Any] = Field(..., description="Output from Decision Engine / Recommendation Agent")
    pipeline_logs: List[str] = Field(..., description="Sequential execution trace log")
