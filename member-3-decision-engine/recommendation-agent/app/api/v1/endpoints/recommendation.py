from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.database import get_db

from app.schemas.recommendation_request import RecommendationRequest
from app.schemas.recommendation_response import RecommendationResponse
from app.services.recommendation_service import RecommendationService
from app.core.logging import logger
from app.core.exceptions import RecommendationValidationError, RecommendationGenerationError

router = APIRouter()
rec_service = RecommendationService()

@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_recommendations(request: Dict[str, Any]):
    result = await rec_service.get_combined_recommendation(request)
    return result

@router.post("/chat", response_model=RecommendationResponse, status_code=status.HTTP_200_OK, tags=["Recommendations"])
@router.post("/recommend/chat", response_model=RecommendationResponse, status_code=status.HTTP_200_OK, tags=["Recommendations"])
@router.post("/recommendation/generate", response_model=RecommendationResponse, status_code=status.HTTP_200_OK, tags=["Recommendations"])
@router.post("/generate", response_model=RecommendationResponse, status_code=status.HTTP_200_OK, tags=["Recommendations"])
@router.post(
    "/recommend",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate executive recommendations or chat response",
    description=(
        "Accepts aggregated outputs from Demand, Inventory, Supply, and Production agents "
        "plus an optional user chat question. "
        "Returns a structured executive recommendation report using full manufacturing context."
    ),
    tags=["Recommendations"],
)
async def get_recommendation(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
) -> RecommendationResponse:
    logger.info(
        "POST /recommend — product='%s' | question='%s'",
        request.demand.product,
        request.question or "",
    )

    try:
        service = RecommendationService()
        recommendation = await service.recommend(request, db=db)
        logger.info(
            "Recommendation returned — risk=%s | ai_enhanced=%s",
            recommendation.risk,
            recommendation.ai_enhanced,
        )
        return recommendation

    except HTTPException:
        raise

    except RecommendationValidationError as exc:
        logger.warning("Validation error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except RecommendationGenerationError as exc:
        logger.error("Generation error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.error("Unexpected error in /recommend: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating recommendations.",
        ) from exc
