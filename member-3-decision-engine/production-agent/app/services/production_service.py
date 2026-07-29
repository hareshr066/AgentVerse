"""
Production Planning Agent - ProductionPlannerService

Central service that orchestrates all business logic for generating an
optimized production plan from demand, inventory, supply chain, and capacity parameters.

Business Rules:
    1. Production Quantity = forecast_demand - current_inventory + safety_stock
    2. Production Days = math.ceil(production_quantity / daily_capacity)
    3. Capacity Utilization = (production_quantity / (daily_capacity * production_days)) * 100
    4. Priority Rules:
          - Supplier Delay > 5 days -> CRITICAL
          - Forecast Demand > Current Inventory -> HIGH
          - Otherwise -> NORMAL
    5. Machine Allocation:
          - Distribute production to machines based on specified or default capacities.
"""

import math
from typing import List
from app.schemas.production_request import ProductionPlanRequest
from app.schemas.production_response import ProductionPlanResponse, MachineSlot
from app.core.logging import logger


class ProductionPlannerService:
    """
    Orchestrates the full production planning calculation.
    """

    def generate_plan(self, request: ProductionPlanRequest) -> ProductionPlanResponse:
        """
        Generate an optimized production plan.

        Args:
            request: Validated ProductionPlanRequest.

        Returns:
            ProductionPlanResponse populated with computed metrics.
        """
        logger.info(
            "Generating production plan for product='%s' | demand=%d | inventory=%d | safety_stock=%d | daily_cap=%d",
            request.product,
            request.forecast_demand,
            request.current_inventory,
            request.safety_stock,
            request.daily_capacity,
        )

        # 1. Compute Production Quantity
        raw_quantity = (
            request.forecast_demand - request.current_inventory + request.safety_stock
        )
        production_quantity = max(0, raw_quantity)

        # 2. Compute Production Days
        daily_cap = max(1, request.daily_capacity)
        if production_quantity > 0:
            production_days = math.ceil(production_quantity / daily_cap)
        else:
            production_days = 0

        # 3. Compute Capacity Utilization
        if production_days > 0 and (daily_cap * production_days) > 0:
            utilization_val = (production_quantity / (daily_cap * production_days)) * 100.0
            utilization_rounded = round(utilization_val)
            # Format as percentage string, e.g. "97%" or "98%"
            capacity_utilization_str = f"{utilization_rounded}%"
        else:
            utilization_val = 0.0
            capacity_utilization_str = "0%"

        # 4. Determine Priority Rules
        priority = self._determine_priority(request)

        # 5. Generate Machine Allocation Schedule
        machine_schedule = self._generate_machine_schedule(
            request=request,
            production_quantity=production_quantity,
            daily_capacity=daily_cap,
            production_days=production_days,
        )

        # 6. Detect Production Bottlenecks
        bottlenecks = self._detect_bottlenecks(
            request=request,
            utilization_val=utilization_val,
            production_quantity=production_quantity,
        )

        # 7. Generate Machine Usage Optimization Summary
        num_m = len(machine_schedule)
        optimized_usage = (
            f"Production distributed across {num_m} machines with "
            f"{capacity_utilization_str} capacity utilization over {production_days} days."
        )

        message = (
            "Production plan generated successfully."
            if production_quantity > 0
            else "Current inventory covers demand and safety stock. No production required."
        )

        logger.info(
            "Production plan complete — qty=%d | days=%d | util=%s | priority=%s",
            production_quantity,
            production_days,
            capacity_utilization_str,
            priority,
        )

        return ProductionPlanResponse(
            product=request.product,
            production_quantity=production_quantity,
            production_days=production_days,
            capacity_utilization=capacity_utilization_str,
            priority=priority,
            machine_schedule=machine_schedule,
            bottlenecks=bottlenecks,
            optimized_usage=optimized_usage,
            message=message,
        )

    def _determine_priority(self, request: ProductionPlanRequest) -> str:
        """
        Priority Rules:
            - Supplier Delay > 5 days -> CRITICAL
            - Forecast Demand > Current Inventory -> HIGH
            - Otherwise -> NORMAL
        """
        if request.supplier_delay and request.delay_days > 5:
            return "CRITICAL"
        if request.forecast_demand > request.current_inventory:
            return "HIGH"
        return "NORMAL"

    def _generate_machine_schedule(
        self,
        request: ProductionPlanRequest,
        production_quantity: int,
        daily_capacity: int,
        production_days: int,
    ) -> List[MachineSlot]:
        """
        Distribute daily or total production across machines.
        """
        slots: List[MachineSlot] = []

        if request.machines and len(request.machines) > 0:
            # Use explicitly provided machines list
            total_machine_cap = sum(m.capacity for m in request.machines)
            if total_machine_cap == 0:
                total_machine_cap = daily_capacity

            for m in request.machines:
                ratio = m.capacity / total_machine_cap
                allocated = int(round(ratio * daily_capacity))
                slots.append(
                    MachineSlot(
                        machine=m.name,
                        allocated=allocated,
                        machine_id=m.name,
                        assigned_units=allocated,
                        capacity=m.capacity,
                        shift_hours=8.0,
                        utilization_percent=round(ratio * 100.0, 1),
                    )
                )
        else:
            # Generate default machine schedule based on num_machines or default 2 machines
            num_m = request.num_machines if (request.num_machines and request.num_machines > 0) else 2
            per_machine = daily_capacity // num_m
            remainder = daily_capacity % num_m

            names = ["Machine A", "Machine B", "Machine C", "Machine D", "Machine E"]
            for i in range(num_m):
                m_name = names[i] if i < len(names) else f"Machine {i+1}"
                allocated = per_machine + (remainder if i == 0 else 0)
                slots.append(
                    MachineSlot(
                        machine=m_name,
                        allocated=allocated,
                        machine_id=f"M-{i+1}",
                        assigned_units=allocated,
                        capacity=allocated,
                        shift_hours=8.0,
                        utilization_percent=100.0,
                    )
                )

        return slots

    def _detect_bottlenecks(
        self,
        request: ProductionPlanRequest,
        utilization_val: float,
        production_quantity: int,
    ) -> List[str]:
        """
        Detect any operational or supply bottlenecks.
        """
        bottlenecks: List[str] = []

        if request.supplier_delay:
            bottlenecks.append(f"Supplier delay active ({request.delay_days} days)")

        if request.forecast_demand > (request.current_inventory + request.safety_stock):
            gap = request.forecast_demand - request.current_inventory
            bottlenecks.append(f"High demand-inventory deficit ({gap:,} units)")

        if utilization_val >= 95.0:
            bottlenecks.append(f"High facility capacity utilization ({utilization_val:.0f}%)")

        if not bottlenecks:
            bottlenecks.append("No active production bottlenecks detected.")

        return bottlenecks
