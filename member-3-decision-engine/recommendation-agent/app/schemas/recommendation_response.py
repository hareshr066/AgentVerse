"""
Recommendation Agent - Response Schema

Defines the structured AI Manufacturing Consultant response.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class RecommendationResponse(BaseModel):
    """
    Structured AI Manufacturing Consultant Report Response based on PostgreSQL inventory and suppliers tables.
    """

    executive_summary: str = Field(
        ...,
        description="High-level executive summary based on live database values.",
        examples=["Demand exceeds current inventory. Immediate production recommended."],
    )
    current_situation: Optional[str] = Field(
        default=None,
        description="Situation Analysis based on inventory and supplier state.",
    )
    inventory_analysis: Optional[str] = Field(
        default=None,
        description="Inventory Analysis detailing stock, reorder point, and safety stock.",
    )
    demand_analysis: Optional[str] = Field(
        default=None,
        description="Demand Analysis derived from average daily usage and lead time.",
    )
    production_analysis: Optional[str] = Field(
        default=None,
        description="Production Analysis detailing required output and scheduling.",
    )
    supply_chain_analysis: Optional[str] = Field(
        default=None,
        description="Supplier Analysis detailing risk score, delay days, and quality score.",
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Ordered list of recommended executive actions.",
    )
    production: str = Field(
        ...,
        description="Production recommendation decision.",
    )
    inventory: Optional[str] = Field(
        default="Maintain current safety stock levels.",
        description="Inventory recommendation decision.",
    )
    supplier: str = Field(
        ...,
        description="Supplier recommendation decision.",
    )
    business_impact: str = Field(
        ...,
        description="Business impact summary.",
    )
    risk: str = Field(
        ...,
        description="Risk Level: Low | Medium | High | Critical.",
        examples=["High"],
    )
    priority: str = Field(
        ...,
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
