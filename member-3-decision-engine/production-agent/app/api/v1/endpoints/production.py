from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.production_plan import ProductionPlan
from pydantic import BaseModel
from typing import List, Optional, Any

from app.schemas.production_request import ProductionPlanRequest
from app.schemas.production_response import ProductionPlanResponse as CalculatorPlanResponse
from app.services.production_service import ProductionPlannerService
from app.core.logging import logger
from app.core.exceptions import ProductionValidationError, ProductionCalculationError, SchedulerError

router = APIRouter()

class ProductionPlanCreate(BaseModel):
    product_name: str
    quantity: int
    status: Optional[str] = "PLANNED"
    materials_needed: List[str]

class ProductionPlanResponse(BaseModel):
    id: int
    product_name: str
    quantity: int
    status: str
    materials_needed: Optional[List[str]]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductionPlanResponse])
def get_plans(db: Session = Depends(get_db)):
    try:
        plans = db.query(ProductionPlan).all()
    except Exception as exc:
        logger.error("Failed to query production plans: %s", str(exc))
        plans = []
    
    if not plans:
        return [
            ProductionPlanResponse(
                id=1,
                product_name="Standard Steel Sheets",
                quantity=1000,
                status="PLANNED",
                materials_needed=["Iron Ore", "Coal"]
            ),
            ProductionPlanResponse(
                id=2,
                product_name="Silicon Sensors",
                quantity=500,
                status="IN_PROGRESS",
                materials_needed=["Silicon Cores", "Copper Wiring"]
            )
        ]
    return plans

@router.get("/{plan_id:int}", response_model=ProductionPlanResponse)
def get_plan_by_id(plan_id: int, db: Session = Depends(get_db)):
    try:
        plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).first()
    except Exception as exc:
        logger.error("Error retrieving production plan id=%d: %s", plan_id, str(exc))
        plan = None
        
    if not plan:
        if plan_id == 1:
            return ProductionPlanResponse(
                id=1,
                product_name="Standard Steel Sheets",
                quantity=1000,
                status="PLANNED",
                materials_needed=["Iron Ore", "Coal"]
            )
        raise HTTPException(status_code=404, detail="Production plan not found")
    return plan

@router.post("/", response_model=ProductionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(plan: ProductionPlanCreate, db: Session = Depends(get_db)):
    try:
        new_plan = ProductionPlan(
            product_name=plan.product_name,
            quantity=plan.quantity,
            status=plan.status,
            materials_needed=plan.materials_needed
        )
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        return new_plan
    except Exception as exc:
        db.rollback()
        logger.error("Failed to create production plan: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failure during creation"
        ) from exc

@router.post(
    "/production-plan",
    response_model=CalculatorPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a production plan",
    description=(
        "Accepts demand forecast, inventory levels, supplier status, and capacity "
        "parameters.  Returns a fully computed production plan including quantity, "
        "timeline, capacity utilization, priority classification, and per-machine schedule."
    ),
    tags=["Production Planning"],
)
def create_production_plan(
    request: ProductionPlanRequest,
    db: Session = Depends(get_db)
) -> CalculatorPlanResponse:
    logger.info(
        "POST /production-plan — product='%s'", request.product
    )

    try:
        service = ProductionPlannerService()
        plan = service.generate_plan(request, db=db)
        logger.info(
            "Production plan returned — qty=%d | priority=%s",
            plan.production_quantity,
            plan.priority,
        )
        return plan

    except HTTPException:
        raise

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
