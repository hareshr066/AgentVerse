from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any

from app.schemas.recommendation_request import RecommendationRequest
from app.schemas.recommendation_response import RecommendationResponse
from app.services.recommendation_service import RecommendationService
from app.core.logging import logger
from app.core.exceptions import RecommendationValidationError, RecommendationGenerationError

router = APIRouter()
rec_service = RecommendationService()

@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_recommendations(request: Dict[str, Any]):
    # Generate intelligent structured recommendations from factory inputs
    result = await rec_service.get_combined_recommendation(request)
    return result

@router.post(
    "/recommend",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate executive recommendations",
    description=(
        "Accepts aggregated outputs from the Demand Forecast, Inventory, "
        "Supply Chain, and Production Planning agents. "
        "Returns an executive recommendation report covering production, "
        "inventory, supplier, risk analysis, and a summary. "
        "Rule-based by default; Gemini AI enhancement activates automatically "
        "when GEMINI_API_KEY is set."
    ),
    tags=["Recommendations"],
)
async def get_recommendation(request: RecommendationRequest) -> RecommendationResponse:
    logger.info(
        "POST /recommend — product='%s'", request.demand.product
    )

    try:
        service = RecommendationService()
        recommendation = await service.recommend(request)
        logger.info(
            "Recommendation returned — risk=%s | ai_enhanced=%s",
            recommendation.risk,
            recommendation.ai_enhanced,
        )
        return recommendation

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
