from pydantic import BaseModel, Field

class SupplyResponse(BaseModel):
    supplier_name: str = Field(..., description="Name of the supplier")
    supplier_delay: bool = Field(..., description="Indicates if there is a delivery delay")
    delay_days: int = Field(..., description="Number of days delayed")
    risk: str = Field(..., description="Supplier risk level classification")
    recommended_supplier: str = Field(..., description="Name of the recommended supplier")
