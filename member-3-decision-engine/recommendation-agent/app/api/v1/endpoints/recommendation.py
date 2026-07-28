from fastapi import APIRouter, status, Depends
from typing import Dict, Any
from app.services.recommendation_service import RecommendationService

router = APIRouter()
rec_service = RecommendationService()

@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_recommendations(request: Dict[str, Any]):
    # Generate intelligent structured recommendations from factory inputs
    result = await rec_service.get_combined_recommendation(request)
    return result
