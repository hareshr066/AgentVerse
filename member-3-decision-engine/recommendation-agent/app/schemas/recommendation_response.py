"""
Recommendation Agent - Response Schema

Defines the structured AI Manufacturing Consultant response.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class RecommendationResponse(BaseModel):
    """
    Structured AI Manufacturing Consultant Report Response.
    """

    executive_summary: str = Field(
        ...,
        description="High-level executive summary.",
        examples=["Demand is expected to increase significantly."],
    )
    current_situation: Optional[str] = Field(
        default="Demand (12,000 units) exceeds current inventory (4,000 units) by 8,000 units. Active supplier delay of 4 days.",
        description="Situation Analysis based on full manufacturing context.",
    )
    production_analysis: Optional[str] = Field(
        default="Production requires 9,000 units over 10 working days at 97% capacity utilization.",
        description="Production Analysis.",
    )
    inventory_analysis: Optional[str] = Field(
        default="Current inventory is below required safety stock buffer.",
        description="Inventory Analysis.",
    )
    supply_chain_analysis: Optional[str] = Field(
        default="Active 4-day supplier delay creates a potential material availability bottleneck.",
        description="Supply Chain Analysis.",
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Ordered list of recommended executive actions.",
        examples=[["Increase production by 20%.", "Increase safety stock.", "Use alternate supplier."]],
    )
    production: str = Field(
        default="Increase production by 20%.",
        description="Production recommendation shorthand.",
    )
    inventory: str = Field(
        default="Increase safety stock.",
        description="Inventory recommendation shorthand.",
    )
    supplier: str = Field(
        default="Use alternate supplier.",
        description="Supplier recommendation shorthand.",
    )
    business_impact: str = Field(
        default="High business impact: Mitigates potential revenue loss on 8,000 units.",
        description="Business impact summary.",
    )
    risk: str = Field(
        ...,
        description="Risk Level: Low | Medium | High | Critical.",
        examples=["High"],
    )
    priority: str = Field(
        default="High",
        description="Priority Level: Normal | High | Critical.",
        examples=["High"],
    )
    confidence: str = Field(
        default="96%",
        description="AI Confidence Score percentage.",
        examples=["96%"],
    )
    priority_actions: Optional[List[str]] = Field(
        default=None,
        description="Priority actions list alias.",
    )
    risk_factors: Optional[List[str]] = Field(
        default=None,
        description="Key risk factors identified.",
    )
    ai_enhanced: bool = Field(
        default=False,
        description="Indicates whether LLM AI was activated.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "executive_summary": "Demand is expected to increase significantly.",
                "current_situation": "Demand (12,000 units) exceeds inventory (4,000 units) by 8,000 units.",
                "production_analysis": "Production run of 9,000 units required over 10 days at 97% utilization.",
                "inventory_analysis": "Inventory is below safety stock.",
                "supply_chain_analysis": "Active 4-day supplier delay.",
                "recommended_actions": [
                    "Increase production by 20%.",
                    "Increase safety stock.",
                    "Use alternate supplier."
                ],
                "production": "Increase production by 20%.",
                "inventory": "Increase safety stock.",
                "supplier": "Use alternate supplier.",
                "business_impact": "High business impact: Mitigates revenue loss.",
                "risk": "High",
                "priority": "High",
                "confidence": "96%",
                "ai_enhanced": False,
            }
        }
    }
