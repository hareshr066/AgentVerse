"""
Production Planning Agent - Machine Scheduler

Distributes the total production quantity evenly across all available
machines and computes per-machine shift hours and utilization.

Design decisions:
- Units are split as evenly as possible; any remainder is added to the
  first machine so totals always sum to production_quantity exactly.
- Shift hours are based on an 8-hour working day per machine per
  production day; the proportional hours for the assigned unit slice
  is derived from the machine's share of daily capacity.
- Each MachineSlot is independent so the schedule can be rendered
  directly in dashboards or passed downstream to MES systems.
"""

import math
from typing import List

from app.schemas.production_response import MachineSlot
from app.core.logging import logger
from app.core.exceptions import SchedulerError


# Hours available per machine per working day
_SHIFT_HOURS_PER_DAY: float = 8.0


class JobScheduler:
    """
    Distributes a production order across a set of identical machines.

    Each machine is assumed to have the same capacity (daily_capacity
    divided evenly across num_machines).  If machines have different
    rated speeds a capacity-weight mapping can be injected via the
    constructor — not required for the current spec.
    """

    def schedule(
        self,
        production_quantity: int,
        daily_capacity: int,
        production_days: float,
        num_machines: int,
    ) -> List[MachineSlot]:
        """
        Build a per-machine schedule for the given production plan.

        Args:
            production_quantity: Total units that must be manufactured.
            daily_capacity:      Total facility units per day (all machines combined).
            production_days:     Duration of the production run in working days.
            num_machines:        Number of machines to distribute work across.

        Returns:
            A list of MachineSlot objects, one per machine.

        Raises:
            SchedulerError: If num_machines is zero/negative or inputs are invalid.
        """
        logger.info(
            "Scheduling %d units across %d machines over %.2f days "
            "(daily_capacity=%d)",
            production_quantity,
            num_machines,
            production_days,
            daily_capacity,
        )

        if num_machines <= 0:
            raise SchedulerError("num_machines must be at least 1.")
        if production_quantity <= 0:
            raise SchedulerError("production_quantity must be greater than zero.")
        if daily_capacity <= 0:
            raise SchedulerError("daily_capacity must be greater than zero.")
        if production_days <= 0:
            raise SchedulerError("production_days must be greater than zero.")

        # --- Unit distribution ------------------------------------------------
        # Each machine gets an equal share; the remainder goes to machine 1.
        base_units: int = production_quantity // num_machines
        remainder: int = production_quantity % num_machines

        # --- Per-machine capacity (units / day) --------------------------------
        machine_daily_cap: float = daily_capacity / num_machines

        # --- Total capacity available per machine across entire run ------------
        machine_total_cap: float = machine_daily_cap * production_days

        slots: List[MachineSlot] = []

        for idx in range(num_machines):
            machine_id = f"M-{idx + 1}"

            # First machine absorbs any remainder to keep total exact
            assigned_units = base_units + (remainder if idx == 0 else 0)

            # Shift hours: proportional fraction of the full run's shift pool
            # Each machine has production_days × _SHIFT_HOURS_PER_DAY hours total.
            # Scale by fraction of the machine's capacity actually consumed.
            if machine_total_cap > 0:
                fraction_used = assigned_units / machine_total_cap
            else:
                fraction_used = 1.0

            shift_hours = round(
                fraction_used * production_days * _SHIFT_HOURS_PER_DAY, 2
            )

            # Utilization: how much of machine_total_cap is consumed
            utilization = round(
                (assigned_units / machine_total_cap) * 100
                if machine_total_cap > 0
                else 100.0,
                2,
            )

            logger.info(
                "  %s → %d units | %.2f shift-hrs | %.2f%% utilization",
                machine_id,
                assigned_units,
                shift_hours,
                utilization,
            )

            slots.append(
                MachineSlot(
                    machine_id=machine_id,
                    assigned_units=assigned_units,
                    shift_hours=shift_hours,
                    utilization_percent=utilization,
                )
            )

        logger.info("Scheduling complete — %d machine slots generated.", len(slots))
        return slots
