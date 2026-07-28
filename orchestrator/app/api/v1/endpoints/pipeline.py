from fastapi import APIRouter, HTTPException, status
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.orchestration_service import OrchestrationService
from app.core.logger import logger

router = APIRouter()
orchestration_service = OrchestrationService()

@router.post("/pipeline/sync", response_model=PipelineResponse, tags=["Pipeline"])
async def sync_pipeline(request: PipelineRequest) -> PipelineResponse:
    try:
        return await orchestration_service.coordinate_workflow(request)
    except Exception as e:
        logger.error("Pipeline execution error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution failed: {str(e)}"
        )

@router.get("/pipeline/sync", response_model=PipelineResponse, tags=["Pipeline"])
async def sync_pipeline_get(product_id: str = "PROD-101", city: str = "Delhi") -> PipelineResponse:
    try:
        request = PipelineRequest(product_id=product_id, city=city)
        return await orchestration_service.coordinate_workflow(request)
    except Exception as e:
        logger.error("Pipeline GET execution error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline GET execution failed: {str(e)}"
        )
