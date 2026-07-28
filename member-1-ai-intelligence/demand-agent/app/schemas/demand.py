from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DemandPredictionRequest(BaseModel):
    product_id: str = Field(..., description="Product identifier or name")
    city: Optional[str] = Field(default="Delhi", description="City for event/weather cross-referencing")
    inventory: Optional[float] = Field(default=0.0, description="Current stock/inventory level")
    sales_history: Optional[List[float]] = Field(default_factory=list, description="Historical sales figures")
    events: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Associated event signals")
    weather: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Associated weather signals")
    event_prediction_id: Optional[int] = Field(default=None, description="Optional ID link to persistent Event Prediction record")

class DemandPredictionResponse(BaseModel):
    predicted_demand: float = Field(..., description="Forecasted demand unit count")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    recommended_order: float = Field(..., description="Recommended reorder quantity")
    reasons: List[str] = Field(..., description="Drivers and explanations behind the prediction")
    demand_prediction_id: Optional[int] = Field(default=None, description="Optional ID link to persistent Demand Prediction record")
    event_prediction_id: Optional[int] = Field(default=None, description="Optional ID link to persistent Event Prediction record")
