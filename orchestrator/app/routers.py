from fastapi import APIRouter, Depends, status
import httpx

from app.dependencies import get_http_client
from app.schemas import InventoryCheckRequest, ProcurementRequest, ProductionRequest, FullAnalysisRequest
import app.services as services

router = APIRouter(prefix="/workflow", tags=["Orchestrator Workflows"])

@router.post("/inventory-check", status_code=status.HTTP_200_OK)
async def workflow_inventory_check(
    payload: InventoryCheckRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    return await services.run_inventory_check_workflow(client, product_name=payload.product_name)

@router.post("/procurement", status_code=status.HTTP_200_OK)
async def workflow_procurement(
    payload: ProcurementRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    return await services.run_procurement_workflow(
        client,
        material_name=payload.material_name,
        quantity_needed=payload.quantity_needed
    )

@router.post("/production", status_code=status.HTTP_200_OK)
async def workflow_production(
    payload: ProductionRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    return await services.run_production_workflow(client, plan_id=payload.plan_id)

@router.post("/event-analysis", status_code=status.HTTP_200_OK)
async def workflow_event_analysis(
    payload: FullAnalysisRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    return await services.run_event_analysis_workflow(
        client,
        product=payload.product,
        city=payload.city
    )

@router.post("/full-analysis", status_code=status.HTTP_200_OK)
async def workflow_full_analysis(
    payload: FullAnalysisRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    return await services.run_full_analysis_workflow(
        client,
        product=payload.product,
        city=payload.city
    )
