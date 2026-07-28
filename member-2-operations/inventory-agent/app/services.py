import math
from app.config import settings
from app.schemas import InventoryRequest, LegacyInventoryResponse
from app.core import logger, InventoryCalculationError

# --- CRUD business logic ---
def calculate_safety_stock(average_daily_usage: float, lead_time: int) -> float:
    return float(average_daily_usage * lead_time)

def calculate_reorder_point(average_daily_usage: float, lead_time: int, safety_stock: float) -> float:
    return float((average_daily_usage * lead_time) + safety_stock)

def calculate_eoq(average_daily_usage: float) -> float:
    annual_demand = average_daily_usage * 365
    ordering_cost = settings.DEFAULT_ORDERING_COST
    holding_cost = settings.DEFAULT_HOLDING_COST
    if holding_cost <= 0:
        return 0.0
    eoq_value = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
    return float(eoq_value)

def determine_status(current_stock: int, reorder_point: float) -> str:
    if reorder_point <= 0:
        return "Healthy"
    if current_stock <= reorder_point * 0.5:
        return "Critical"
    elif current_stock <= reorder_point:
        return "Low Stock"
    elif current_stock <= reorder_point * 2.0:
        return "Healthy"
    else:
        return "Overstock"

def compute_inventory_metrics(current_stock: int, average_daily_usage: float, lead_time: int) -> dict:
    safety_stock = calculate_safety_stock(average_daily_usage, lead_time)
    reorder_point = calculate_reorder_point(average_daily_usage, lead_time, safety_stock)
    eoq = calculate_eoq(average_daily_usage)
    status = determine_status(current_stock, reorder_point)
    return {
        "safety_stock": safety_stock,
        "reorder_point": reorder_point,
        "eoq": eoq,
        "status": status
    }

# --- Legacy service class ---
class InventoryService:
    def calculate_inventory(self, request: InventoryRequest) -> LegacyInventoryResponse:
        logger.info("Received inventory calculation request for product: %s", request.product)
        safety_stock = self._calculate_safety_stock(
            daily_demand=request.daily_demand,
            lead_time=request.lead_time
        )
        reorder_point = self._calculate_reorder_point(
            daily_demand=request.daily_demand,
            lead_time=request.lead_time,
            safety_stock=safety_stock
        )
        inventory_status = self._calculate_inventory_status(
            current_stock=request.current_stock,
            reorder_point=reorder_point
        )
        eoq = self._calculate_eoq(
            annual_demand=request.forecast_demand,
            ordering_cost=request.ordering_cost,
            holding_cost=request.holding_cost
        )
        logger.info("Inventory calculation successfully completed for product: %s", request.product)
        return LegacyInventoryResponse(
            product=request.product,
            current_stock=request.current_stock,
            safety_stock=safety_stock,
            reorder_point=reorder_point,
            inventory_status=inventory_status,
            economic_order_quantity=eoq,
            message="Inventory calculation completed successfully."
        )

    def _calculate_safety_stock(self, daily_demand: int, lead_time: int) -> int:
        if daily_demand <= 0:
            raise InventoryCalculationError("Daily demand must be greater than zero.")
        if lead_time <= 0:
            raise InventoryCalculationError("Lead time must be greater than zero.")
        return daily_demand * lead_time

    def _calculate_reorder_point(self, daily_demand: int, lead_time: int, safety_stock: int) -> int:
        if daily_demand <= 0:
            raise InventoryCalculationError("Daily demand must be greater than zero.")
        if lead_time <= 0:
            raise InventoryCalculationError("Lead time must be greater than zero.")
        if safety_stock < 0:
            raise InventoryCalculationError("Safety stock cannot be negative.")
        return (daily_demand * lead_time) + safety_stock

    def _calculate_inventory_status(self, current_stock: int, reorder_point: int) -> str:
        if current_stock < 0:
            raise InventoryCalculationError("Current stock cannot be negative.")
        if reorder_point < 0:
            raise InventoryCalculationError("Reorder point cannot be negative.")
        if current_stock <= reorder_point:
            return "LOW"
        elif current_stock <= reorder_point * 1.5:
            return "MEDIUM"
        else:
            return "HEALTHY"

    def _calculate_eoq(self, annual_demand: int, ordering_cost: float, holding_cost: float) -> int:
        if annual_demand <= 0 or ordering_cost <= 0 or holding_cost <= 0:
            raise InventoryCalculationError("Inputs for EOQ calculation must be greater than zero.")
        eoq_value = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        return round(eoq_value)
