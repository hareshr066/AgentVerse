"""
Production Planning Agent - ProductionPlannerService

100% Database-driven production plan calculation using ONLY the existing
'inventory' and 'suppliers' tables in PostgreSQL.
"""

import math
import logging
from typing import List, Optional, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.schemas.production_request import ProductionPlanRequest
from app.schemas.production_response import ProductionPlanResponse, MachineSlot
from app.core.logging import logger

class ProductionPlannerService:
    """
    Computes optimized production plan strictly from database inventory and suppliers tables.
    """

    def generate_plan(self, request: ProductionPlanRequest, db: Optional[Any] = None) -> ProductionPlanResponse:
        """
        Query inventory & suppliers tables and compute production plan.
        """
        product_name = request.product or "Air Conditioner"
        logger.info("Generating DB-driven production plan for product='%s'", product_name)

        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection failure."
            )

        # 1. Read inventory table
        inv_record = None
        try:
            q_inv = text("""
                SELECT product_name, current_stock, average_daily_usage, lead_time, safety_stock, reorder_point, eoq, status
                FROM inventory
                WHERE LOWER(product_name) = LOWER(:pname)
                LIMIT 1
            """)
            if isinstance(db, AsyncSession):
                # Handle async if passed
                inv_record = None
            else:
                inv_record = db.execute(q_inv, {"pname": product_name}).fetchone()
        except Exception as exc:
            logger.error("Database connection failure while reading inventory: %s", str(exc))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection failure."
            ) from exc

        if not inv_record:
            logger.warning("Product '%s' not found in inventory table.", product_name)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in inventory."
            )

        # Unpack inventory values
        inv_product_name = inv_record[0]
        current_stock = int(inv_record[1] or 0)
        average_daily_usage = float(inv_record[2] or 0.0)
        lead_time = int(inv_record[3] or 0)
        safety_stock = int(inv_record[4] or 0)
        reorder_point = int(inv_record[5] or 0)
        eoq = float(inv_record[6] or 0.0)
        inv_status = str(inv_record[7] or "IN_STOCK").upper()

        # 2. Find supplier info using material_name
        supp_record = None
        try:
            q_supp = text("""
                SELECT supplier_name, risk_level, delivery_delay_days, quality_score, available_quantity, risk_score
                FROM suppliers
                WHERE LOWER(material_name) = LOWER(:pname)
                   OR LOWER(:pname) LIKE '%' || LOWER(material_name) || '%'
                ORDER BY recommended DESC, quality_score DESC
                LIMIT 1
            """)
            if not isinstance(db, AsyncSession):
                supp_record = db.execute(q_supp, {"pname": product_name}).fetchone()
        except Exception as exc:
            logger.warning("Could not query suppliers table: %s", str(exc))
            supp_record = None

        if supp_record:
            supplier_name = str(supp_record[0] or "Unknown Supplier")
            supplier_risk = str(supp_record[1] or "LOW").upper()
            supplier_delay = int(supp_record[2] or 0)
            quality_score = float(supp_record[3] or 0.0)
            avail_qty = float(supp_record[4] or 0.0)
            risk_score = float(supp_record[5] or 0.0)
            supplier_msg = f"Supplier '{supplier_name}' active with risk level {supplier_risk}."
        else:
            supplier_name = "Supplier information unavailable"
            supplier_risk = "UNKNOWN"
            supplier_delay = 0
            quality_score = 0.0
            avail_qty = 0.0
            risk_score = 0.0
            supplier_msg = "Supplier information unavailable."

        # 3. Apply Business Logic Calculations
        # Estimated Demand = average_daily_usage * lead_time
        estimated_demand = int(round(average_daily_usage * lead_time))
        if estimated_demand == 0 and request.forecast_demand > 0:
            estimated_demand = request.forecast_demand

        # Required Production = max(0, Estimated Demand + safety_stock - current_stock)
        raw_required = estimated_demand + safety_stock - current_stock
        required_production = max(0, raw_required)

        # Priority Rules: If current_stock <= reorder_point -> Priority = HIGH Else -> Priority = NORMAL
        if current_stock <= reorder_point or (supplier_delay > 5):
            priority = "HIGH" if not (supplier_delay > 5 and current_stock <= reorder_point) else "CRITICAL"
        else:
            priority = "NORMAL"

        # Recommended Batch = max(required_production, eoq)
        recommended_batch = int(max(required_production, round(eoq)))

        # Production Days
        daily_cap = max(1, request.daily_capacity)
        production_days = math.ceil(required_production / daily_cap) if required_production > 0 else 0

        # Capacity Utilization
        if production_days > 0 and (daily_cap * production_days) > 0:
            util_val = round((required_production / (daily_cap * production_days)) * 100)
            capacity_utilization_str = f"{util_val}%"
        else:
            capacity_utilization_str = "0%"

        # Machine Schedule
        num_m = request.num_machines if (request.num_machines and request.num_machines > 0) else 2
        machine_schedule = []
        names = ["Machine A", "Machine B", "Machine C", "Machine D"]
        per_m = daily_cap // num_m
        rem = daily_cap % num_m
        for i in range(num_m):
            m_name = names[i] if i < len(names) else f"Machine {i+1}"
            alloc = per_m + (rem if i == 0 else 0)
            machine_schedule.append(
                MachineSlot(
                    machine=m_name,
                    allocated=alloc,
                    machine_id=f"M-{i+1}",
                    assigned_units=alloc,
                    capacity=alloc,
                    shift_hours=8.0,
                    utilization_percent=100.0,
                )
            )

        # Bottlenecks & Optimization
        bottlenecks = []
        if current_stock <= reorder_point:
            bottlenecks.append(f"Current stock ({current_stock:,}) is below reorder point ({reorder_point:,}).")
        if supplier_delay > 0:
            bottlenecks.append(f"Active supplier delay of {supplier_delay} days ({supplier_name}).")
        if not bottlenecks:
            bottlenecks.append("No critical production bottlenecks detected.")

        optimized_usage = (
            f"Required production batch of {recommended_batch:,} units distributed across {num_m} machines "
            f"over {production_days} days. {supplier_msg}"
        )

        message = (
            "Production plan generated successfully from database inventory."
            if required_production > 0
            else "Current stock covers estimated demand and safety stock. No immediate production required."
        )

        return ProductionPlanResponse(
            product=inv_product_name,
            current_stock=current_stock,
            estimated_demand=estimated_demand,
            lead_time=lead_time,
            safety_stock=safety_stock,
            reorder_point=reorder_point,
            eoq=eoq,
            production_quantity=required_production,
            recommended_batch=recommended_batch,
            priority=priority,
            inventory_status=inv_status,
            supplier_name=supplier_name,
            supplier_risk=supplier_risk,
            supplier_delay=supplier_delay,
            quality_score=quality_score,
            production_days=production_days,
            capacity_utilization=capacity_utilization_str,
            machine_schedule=machine_schedule,
            bottlenecks=bottlenecks,
            optimized_usage=optimized_usage,
            message=message,
        )
