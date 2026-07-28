from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.demand import DemandPredictionRequest, DemandPredictionResponse
from app.services.demand_service import DemandService
from app.core.logger import logger
import sys
import os

# Fix Python path for shared module if not already set
current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # demand-agent directory
parent_root = os.path.abspath(os.path.join(current_dir, "..")) # E:\agentverse
if parent_root not in sys.path:
    sys.path.insert(0, parent_root)

from shared.database import get_db, engine, Base
from shared.repository import PredictionRepository


# Auto create tables
Base.metadata.create_all(bind=engine)

router = APIRouter()
demand_service = DemandService()

@router.post("/predict-demand", response_model=DemandPredictionResponse, tags=["Demand"])
@router.post("/demand/predict", response_model=DemandPredictionResponse, tags=["Demand"])
async def predict_demand(request: DemandPredictionRequest, db: Session = Depends(get_db)) -> DemandPredictionResponse:
    try:
        response = await demand_service.predict_demand(request)
        
        # Calculate sales average
        sales = request.sales_history or []
        sales_avg = sum(sales)/len(sales) if sales else 100.0

        demand_prediction_data = {
            "product_id": request.product_id,
            "city": request.city,
            "predicted_demand": response.predicted_demand,
            "confidence": response.confidence,
            "recommended_order": response.recommended_order,
            "inventory": float(request.inventory or 0),
            "sales_average": sales_avg,
            "event_prediction_id": request.event_prediction_id
        }

        try:
            db_demand = PredictionRepository.create_demand_prediction(db, demand_prediction_data)
            response.demand_prediction_id = db_demand.id
            response.event_prediction_id = request.event_prediction_id
        except Exception as db_err:
            logger.warning("Could not persist demand prediction to DB: %s", str(db_err))

        return response
    except Exception as e:
        logger.error("Error predicting demand for product %s: %s", request.product_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process demand prediction: {str(e)}"
        )

