from fastapi import APIRouter, Query
from app.services.news_service import fetch_news
from app.services.weather_service import fetch_weather
from app.services.trends_service import fetch_trends
from app.services.gemini_service import analyze_event

router = APIRouter()

@router.get("/event-score")
async def get_event_score(
    product: str = Query(..., description="Product name"),
    city: str = Query(..., description="City name")
):
    news_articles = await fetch_news(product, city)
    weather_data = await fetch_weather(city)
    trends_data = await fetch_trends(product)
    analysis_data = await analyze_event(news_articles, weather_data, trends_data)

    return {
        "news": news_articles,
        "weather": weather_data,
        "trends": trends_data,
        "analysis": analysis_data
    }
