from pydantic import BaseModel, Field

class InventoryResponse(BaseModel):
    product: str = Field(..., description="Name or ID of the product")
    current_stock: int = Field(..., description="Current level of stock")
    safety_stock: int = Field(..., description="Calculated safety stock level")
    reorder_point: int = Field(..., description="Calculated reorder point level")
    inventory_status: str = Field(..., description="Calculated inventory status (LOW, MEDIUM, HEALTHY)")
    economic_order_quantity: int = Field(..., description="Calculated Economic Order Quantity (EOQ)")
    message: str = Field(..., description="Response status message")
