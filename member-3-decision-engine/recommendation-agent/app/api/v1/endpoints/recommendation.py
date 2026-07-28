"""
Recommendation Agent - /recommend endpoint

POST /recommend
    Accepts aggregated data from all upstream agents and returns
    a structured executive recommendation report.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.recommendation_request import RecommendationRequest
from app.schemas.recommendation_response import RecommendationResponse
from app.services.recommendation_service import RecommendationService
from app.core.logging import logger
from app.core.exceptions import RecommendationValidationError, RecommendationGenerationError

router = APIRouter()


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
    """
    Generate a manufacturing recommendation report.

    - **demand**: Demand forecast data (product, forecast_demand)
    - **inventory**: Current inventory state (current_inventory, safety_stock)
    - **supply**: Supply chain status — optional (supplier_delay, delay_days)
    - **production**: Production plan (production_quantity, capacity_utilization, priority)
    """
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
