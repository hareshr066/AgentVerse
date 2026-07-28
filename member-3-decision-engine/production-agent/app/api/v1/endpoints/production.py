"""
Production Planning Agent - /production-plan endpoint

POST /production-plan
    Accepts a ProductionPlanRequest, runs the full planning pipeline,
    and returns a ProductionPlanResponse.

All domain exceptions are caught here and mapped to appropriate
HTTP status codes so the business logic layer stays framework-agnostic.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.production_request import ProductionPlanRequest
from app.schemas.production_response import ProductionPlanResponse
from app.services.production_service import ProductionPlannerService
from app.core.logging import logger
from app.core.exceptions import ProductionValidationError, ProductionCalculationError, SchedulerError

router = APIRouter()


@router.post(
    "/production-plan",
    response_model=ProductionPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a production plan",
    description=(
        "Accepts demand forecast, inventory levels, supplier status, and capacity "
        "parameters.  Returns a fully computed production plan including quantity, "
        "timeline, capacity utilization, priority classification, and per-machine schedule."
    ),
    tags=["Production Planning"],
)
def create_production_plan(request: ProductionPlanRequest) -> ProductionPlanResponse:
    """
    Generate a production plan.

    - **product**: Name/ID of the product to manufacture
    - **forecast_demand**: Total units forecasted for the period
    - **current_inventory**: Units already in stock
    - **safety_stock**: Minimum buffer units to maintain
    - **supplier_delay**: Whether an active supplier delay exists
    - **delay_days**: Number of days delayed (required when supplier_delay=true)
    - **daily_capacity**: Max units the facility can produce per day
    - **num_machines**: Number of machines available (default: 3)
    """
    logger.info(
        "POST /production-plan — product='%s'", request.product
    )

    try:
        service = ProductionPlannerService()
        plan = service.generate_plan(request)
        logger.info(
            "Production plan returned — qty=%d | priority=%s",
            plan.production_quantity,
            plan.priority,
        )
        return plan

    except ProductionValidationError as exc:
        logger.warning("Validation error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except (ProductionCalculationError, SchedulerError) as exc:
        logger.error("Calculation/scheduler error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.error("Unexpected error in production plan: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the production plan.",
        ) from exc
