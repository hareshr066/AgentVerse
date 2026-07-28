"""
Production Planning Agent - ProductionPlannerService

Central service that orchestrates all business logic for generating a
production plan.  It delegates to CapacityAnalyzer (utilization) and
JobScheduler (machine distribution) so each concern stays isolated.

Business rules (from spec):
    production_quantity = forecast_demand - current_inventory + safety_stock
    production_days     = production_quantity / daily_capacity
    capacity_utilization = (production_quantity / (daily_capacity × production_days)) × 100

Priority rules:
    delay_days > 5          → CRITICAL
    forecast_demand > current_inventory → HIGH
    otherwise               → NORMAL
"""

import math
from app.schemas.production_request import ProductionPlanRequest
from app.schemas.production_response import ProductionPlanResponse
from app.capacity.capacity_analyzer import CapacityAnalyzer
from app.scheduler.job_scheduler import JobScheduler
from app.core.logging import logger
from app.core.exceptions import ProductionValidationError, ProductionCalculationError


class ProductionPlannerService:
    """
    Orchestrates the full production planning pipeline.

    Instantiate once per request (or as a singleton — it holds no
    mutable state between calls).
    """

    def __init__(self) -> None:
        self._capacity_analyzer = CapacityAnalyzer()
        self._scheduler = JobScheduler()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_plan(self, request: ProductionPlanRequest) -> ProductionPlanResponse:
        """
        Generate a complete production plan from the validated request.

        Workflow:
            1. Compute production_quantity
            2. Validate quantity is positive
            3. Compute production_days
            4. Compute capacity_utilization via CapacityAnalyzer
            5. Determine priority
            6. Build machine schedule via JobScheduler
            7. Return assembled ProductionPlanResponse

        Args:
            request: Validated ProductionPlanRequest from the API layer.

        Returns:
            ProductionPlanResponse with all computed fields populated.

        Raises:
            ProductionValidationError: When computed quantity is zero or negative.
            ProductionCalculationError: When a numeric computation fails.
        """
        logger.info(
            "Generating production plan for product='%s' | "
            "forecast=%d | inventory=%d | safety_stock=%d | "
            "daily_capacity=%d | supplier_delay=%s | delay_days=%d",
            request.product,
            request.forecast_demand,
            request.current_inventory,
            request.safety_stock,
            request.daily_capacity,
            request.supplier_delay,
            request.delay_days,
        )

        # ── Step 1: Production Quantity ────────────────────────────────
        production_quantity = self._compute_production_quantity(request)

        # ── Step 2: Production Days ────────────────────────────────────
        production_days = self._compute_production_days(
            production_quantity, request.daily_capacity
        )

        # ── Step 3: Capacity Utilization ───────────────────────────────
        utilization_raw = self._capacity_analyzer.compute_utilization(
            production_quantity=production_quantity,
            daily_capacity=request.daily_capacity,
            production_days=production_days,
        )
        capacity_utilization_str = self._capacity_analyzer.format_utilization(
            utilization_raw
        )

        # ── Step 4: Priority ───────────────────────────────────────────
        priority = self._determine_priority(request)

        # ── Step 5: Machine Schedule ───────────────────────────────────
        num_machines: int = request.num_machines or 3
        machine_schedule = self._scheduler.schedule(
            production_quantity=production_quantity,
            daily_capacity=request.daily_capacity,
            production_days=production_days,
            num_machines=num_machines,
        )

        logger.info(
            "Plan complete — qty=%d | days=%.2f | utilization=%s | priority=%s",
            production_quantity,
            production_days,
            capacity_utilization_str,
            priority,
        )

        return ProductionPlanResponse(
            product=request.product,
            production_quantity=production_quantity,
            production_days=round(production_days, 2),
            capacity_utilization=capacity_utilization_str,
            priority=priority,
            machine_schedule=machine_schedule,
            message="Production plan generated successfully.",
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _compute_production_quantity(self, request: ProductionPlanRequest) -> int:
        """
        production_quantity = forecast_demand - current_inventory + safety_stock

        If the result is zero or negative it means existing inventory
        already covers demand plus the required buffer — we raise a
        validation error so the caller can handle it appropriately
        (the API returns HTTP 422 with a clear message).
        """
        quantity = (
            request.forecast_demand
            - request.current_inventory
            + request.safety_stock
        )

        logger.info(
            "Production quantity: %d - %d + %d = %d",
            request.forecast_demand,
            request.current_inventory,
            request.safety_stock,
            quantity,
        )

        if quantity <= 0:
            raise ProductionValidationError(
                f"Computed production_quantity ({quantity}) is not positive. "
                "Current inventory already covers forecast demand plus safety stock. "
                "No production run is required."
            )

        return quantity

    def _compute_production_days(
        self, production_quantity: int, daily_capacity: int
    ) -> float:
        """
        production_days = production_quantity / daily_capacity

        Uses math.ceil-equivalent float division so fractional days are
        preserved in the response (the API rounds to 2 decimal places).
        """
        if daily_capacity <= 0:
            raise ProductionCalculationError(
                "daily_capacity must be greater than zero."
            )

        days = production_quantity / daily_capacity
        logger.info(
            "Production days: %d / %d = %.4f",
            production_quantity,
            daily_capacity,
            days,
        )
        return days

    def _determine_priority(self, request: ProductionPlanRequest) -> str:
        """
        Apply priority rules in order of descending severity:

            delay_days > 5                      → CRITICAL
            forecast_demand > current_inventory → HIGH
            otherwise                           → NORMAL
        """
        if request.supplier_delay and request.delay_days > 5:
            priority = "CRITICAL"
        elif request.forecast_demand > request.current_inventory:
            priority = "HIGH"
        else:
            priority = "NORMAL"

        logger.info(
            "Priority determined: %s (delay_days=%d, forecast=%d, inventory=%d)",
            priority,
            request.delay_days,
            request.forecast_demand,
            request.current_inventory,
        )
        return priority
