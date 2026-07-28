from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from app.services.news_service import fetch_news
from app.services.weather_service import fetch_weather
from app.services.trends_service import fetch_trends
from app.services.gemini_service import analyze_event
import sys
import os

# Fix Python path for shared module if not already set
current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # event-agent directory
parent_root = os.path.abspath(os.path.join(current_dir, "..")) # E:\agentverse
if parent_root not in sys.path:
    sys.path.insert(0, parent_root)

from shared.database import get_db, engine, Base
from shared.repository import PredictionRepository


# Automatically initialize tables (SQLite database.db)
Base.metadata.create_all(bind=engine)

router = APIRouter()

@router.get("/event-score")
async def get_event_score(
    product: str = Query(..., description="Product name"),
    city: str = Query(..., description="City name"),
    db: Session = Depends(get_db)
):
    news_articles = await fetch_news(product, city)
    weather_data = await fetch_weather(city)
    trends_data = await fetch_trends(product)
    analysis_data = await analyze_event(news_articles, weather_data, trends_data)

    event_prediction_data = {
        "city": city,
        "event_name": analysis_data.get("summary") or (news_articles[0].get("title") if news_articles else "No major event"),
        "category": analysis_data.get("event_category") or "Normal",
        "impact_score": analysis_data.get("impact_score") or 50,
        "weather_condition": weather_data.get("condition"),
        "temperature": weather_data.get("temperature"),
        "news_summary": analysis_data.get("reasoning") or (news_articles[0].get("description") if news_articles else None)
    }

    event_id = None
    try:
        db_event = PredictionRepository.create_event_prediction(db, event_prediction_data)
        event_id = db_event.id
    except Exception as e:
        # Keep API running if db fails
        pass

    return {
        "news": news_articles,
        "weather": weather_data,
        "trends": trends_data,
        "analysis": analysis_data,
        "event_prediction_id": event_id
    }

