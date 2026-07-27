import math
from app.schemas import InventoryRequest, InventoryResponse
from app.core import logger, InventoryCalculationError

class InventoryService:
    def calculate_inventory(self, request: InventoryRequest) -> InventoryResponse:
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
        
        return InventoryResponse(
            product=request.product,
            current_stock=request.current_stock,
            safety_stock=safety_stock,
            reorder_point=reorder_point,
            inventory_status=inventory_status,
            economic_order_quantity=eoq,
            message="Inventory calculation completed successfully."
        )

    def _calculate_safety_stock(self, daily_demand: int, lead_time: int) -> int:
        """
        Calculates the safety stock required to avoid stockouts.
        Formula: Safety Stock = Daily Demand * Lead Time
        """
        logger.info("Calculating safety stock (Daily Demand: %d, Lead Time: %d)", daily_demand, lead_time)
        if daily_demand <= 0:
            raise InventoryCalculationError("Daily demand must be greater than zero.")
        if lead_time <= 0:
            raise InventoryCalculationError("Lead time must be greater than zero.")
            
        result = daily_demand * lead_time
        logger.info("Calculated safety stock: %d", result)
        return result

    def _calculate_reorder_point(self, daily_demand: int, lead_time: int, safety_stock: int) -> int:
        """
        Calculates the reorder point (ROP) at which a new order should be placed.
        Formula: Reorder Point = (Daily Demand * Lead Time) + Safety Stock
        """
        logger.info("Calculating reorder point (Daily Demand: %d, Lead Time: %d, Safety Stock: %d)", daily_demand, lead_time, safety_stock)
        if daily_demand <= 0:
            raise InventoryCalculationError("Daily demand must be greater than zero.")
        if lead_time <= 0:
            raise InventoryCalculationError("Lead time must be greater than zero.")
        if safety_stock < 0:
            raise InventoryCalculationError("Safety stock cannot be negative.")
            
        result = (daily_demand * lead_time) + safety_stock
        logger.info("Calculated reorder point: %d", result)
        return result

    def _calculate_inventory_status(self, current_stock: int, reorder_point: int) -> str:
        """
        Determines the inventory status based on current stock vs reorder point.
        """
        logger.info("Calculating inventory status (Current Stock: %d, Reorder Point: %d)", current_stock, reorder_point)
        if current_stock < 0:
            raise InventoryCalculationError("Current stock cannot be negative.")
        if reorder_point < 0:
            raise InventoryCalculationError("Reorder point cannot be negative.")
            
        if current_stock <= reorder_point:
            status = "LOW"
        elif current_stock <= reorder_point * 1.5:
            status = "MEDIUM"
        else:
            status = "HEALTHY"
        logger.info("Determined inventory status: %s", status)
        return status

    def _calculate_eoq(self, annual_demand: int, ordering_cost: float, holding_cost: float) -> int:
        """
        Calculates the Economic Order Quantity (EOQ).
        Formula: EOQ = sqrt((2 * Annual Demand * Ordering Cost) / Holding Cost)
        Rounds the result to the nearest integer.
        """
        logger.info("Calculating Economic Order Quantity (Annual Demand: %d, Ordering Cost: %.2f, Holding Cost: %.2f)", annual_demand, ordering_cost, holding_cost)
        if annual_demand <= 0:
            raise InventoryCalculationError("Annual demand must be greater than zero for EOQ calculation.")
        if ordering_cost <= 0:
            raise InventoryCalculationError("Ordering cost must be greater than zero for EOQ calculation.")
        if holding_cost <= 0:
            raise InventoryCalculationError("Holding cost must be greater than zero for EOQ calculation.")
            
        eoq_value = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        result = round(eoq_value)
        logger.info("Calculated Economic Order Quantity: %d", result)
        return result
