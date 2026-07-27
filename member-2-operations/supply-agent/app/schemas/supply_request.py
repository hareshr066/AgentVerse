from pydantic import BaseModel, Field

class SupplyRequest(BaseModel):
    supplier_name: str = Field(..., description="Name of the supplier")
    expected_delivery_days: int = Field(..., description="Expected delivery lead time in days")
    actual_delivery_days: int = Field(..., description="Actual delivery lead time in days")
    supplier_rating: float = Field(..., description="Rating score of the supplier")
