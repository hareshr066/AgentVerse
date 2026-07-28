from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class InventoryCheckRequest(BaseModel):
    product_name: Optional[str] = Field(None, description="Optional filter by product name")

class ProcurementRequest(BaseModel):
    material_name: str = Field(..., description="Name of the material to procure")
    quantity_needed: int = Field(..., gt=0, description="Quantity needed")

class ProductionRequest(BaseModel):
    plan_id: Optional[int] = Field(None, description="Optional plan ID to trigger production workflow for")

class FullAnalysisRequest(BaseModel):
    product: str = Field(..., description="Product name for market trends/event check")
    city: str = Field(..., description="City name for local event/weather check")
