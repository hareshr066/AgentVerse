"""
Production Planning Agent - Capacity Analyzer

Computes capacity utilization for a given production plan.
Capacity utilization answers: "Of all the machine-days available,
what fraction is actually consumed by this production run?"

Formula (from spec):
    capacity_utilization = (production_quantity / (daily_capacity × production_days)) × 100

Because production_days = production_quantity / daily_capacity, the
utilization will always be 100 % when the plan exactly fills every
available machine-day.  The analyzer also surfaces whether the plan
creates an overload condition (utilization > 100 %).
"""

from app.core.logging import logger
from app.core.exceptions import ProductionCalculationError


class CapacityAnalyzer:
    """
    Stateless helper that evaluates production capacity metrics.

    All methods are pure functions so they can be unit-tested
    in isolation without any external dependencies.
    """

    def compute_utilization(
        self,
        production_quantity: int,
        daily_capacity: int,
        production_days: float,
    ) -> float:
        """
        Calculate the capacity utilization percentage.

        Args:
            production_quantity: Total units to produce.
            daily_capacity:      Maximum units the facility can make per day.
            production_days:     Number of days the production run spans.

        Returns:
            Utilization as a float (e.g. 96.67 represents 96.67 %).

        Raises:
            ProductionCalculationError: If any argument is non-positive or
                the denominator evaluates to zero.
        """
        logger.info(
            "Computing capacity utilization — qty=%d, daily_cap=%d, days=%.4f",
            production_quantity,
            daily_capacity,
            production_days,
        )

        if production_quantity <= 0:
            raise ProductionCalculationError(
                "production_quantity must be greater than zero."
            )
        if daily_capacity <= 0:
            raise ProductionCalculationError(
                "daily_capacity must be greater than zero."
            )
        if production_days <= 0:
            raise ProductionCalculationError(
                "production_days must be greater than zero."
            )

        total_available = daily_capacity * production_days
        if total_available == 0:
            raise ProductionCalculationError(
                "Total available capacity (daily_capacity × production_days) "
                "must not be zero."
            )

        utilization = (production_quantity / total_available) * 100
        logger.info("Capacity utilization computed: %.2f%%", utilization)
        return round(utilization, 2)

    def format_utilization(self, utilization: float) -> str:
        """
        Format a raw utilization float as a display string.

        Args:
            utilization: Float utilization value (e.g. 96.67).

        Returns:
            Formatted string such as "96.67%".
        """
        return f"{utilization:.2f}%"

    def is_overloaded(self, utilization: float) -> bool:
        """
        Return True if capacity utilization exceeds 100 %, meaning
        the plan requires more capacity than is physically available.
        """
        return utilization > 100.0
