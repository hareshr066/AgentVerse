import sys
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Fix Python path for shared module if not already set
current_dir = os.path.dirname(os.path.abspath(__file__)) # shared folder
parent_root = os.path.abspath(os.path.join(current_dir, "..")) # E:\agentverse
if parent_root not in sys.path:
    sys.path.insert(0, parent_root)

from shared.database import get_db, engine, Base
from shared.repository import PredictionRepository


# Auto-initialize database schema tables
Base.metadata.create_all(bind=engine)

router = APIRouter()

@router.get("/events/history", tags=["Database"])
async def get_events_history(db: Session = Depends(get_db)):
    records = PredictionRepository.fetch_event_predictions(db, limit=50)
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "city": r.city,
            "event_name": r.event_name,
            "category": r.category,
            "impact_score": r.impact_score,
            "weather_condition": r.weather_condition,
            "temperature": r.temperature,
            "news_summary": r.news_summary
        }
        for r in records
    ]

@router.get("/demand/history", tags=["Database"])
async def get_demand_history(db: Session = Depends(get_db)):
    records = PredictionRepository.fetch_demand_predictions(db, limit=50)
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "product_id": r.product_id,
            "city": r.city,
            "predicted_demand": r.predicted_demand,
            "confidence": r.confidence,
            "recommended_order": r.recommended_order,
            "inventory": r.inventory,
            "sales_average": r.sales_average,
            "event_prediction_id": r.event_prediction_id
        }
        for r in records
    ]

@router.get("/pipeline/history", tags=["Database"])
async def get_pipeline_history(db: Session = Depends(get_db)):
    records = PredictionRepository.fetch_pipeline_runs(db, limit=50)
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "product_id": r.product_id,
            "city": r.city,
            "status": r.status,
            "execution_time_ms": r.execution_time_ms,
            "event_prediction_id": r.event_prediction_id,
            "demand_prediction_id": r.demand_prediction_id,
            "decision_status": r.decision_status
        }
        for r in records
    ]
