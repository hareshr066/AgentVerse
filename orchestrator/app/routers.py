from fastapi import APIRouter, Depends, status
import httpx
from typing import Any, Dict, List

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


# ── Frontend-facing routes ────────────────────────────────────────────────────

# POST /pipeline/sync — triggered by the Dashboard "Run Pipeline" button
pipeline_router = APIRouter(tags=["Pipeline"])

class PipelineSyncRequest(FullAnalysisRequest):
    from pydantic import Field
    product_id: str = Field(default="PROD-101")
    current_stock: int = Field(default=1000)
    sales_history: List[float] = Field(default_factory=list)
    daily_demand: int = Field(default=12)
    lead_time: int = Field(default=4)

@pipeline_router.post("/pipeline/sync", status_code=status.HTTP_200_OK)
async def pipeline_sync(
    payload: Dict[str, Any],
    client: httpx.AsyncClient = Depends(get_http_client)
):
    """Full pipeline: Event → Demand → Inventory → Supply → Recommendation."""
    product = payload.get("product_id", payload.get("product", "PROD-101"))
    city = payload.get("city", "Delhi")
    result = await services.run_full_analysis_workflow(client, product=product, city=city)
    result["pipeline_logs"] = [
        f"[1/5] Event Agent: Fetching market signals for {product} in {city}",
        f"[2/5] Demand Agent: Forecasting demand",
        f"[3/5] Inventory Agent: Checking stock levels",
        f"[4/5] Supply Agent: Evaluating supplier status",
        f"[5/5] Recommendation Agent: Generating executive insights",
        f"[DONE] Pipeline complete."
    ]
    return result

# GET /status — alias for /health used by some frontend versions
@pipeline_router.get("/status", status_code=status.HTTP_200_OK)
async def get_status(client: httpx.AsyncClient = Depends(get_http_client)):
    return await services.get_health_status(client)

# GET /events/history — returns recent event scores
@pipeline_router.get("/events/history", status_code=status.HTTP_200_OK)
async def get_events_history(client: httpx.AsyncClient = Depends(get_http_client)):
    from app.config import settings
    result = await services.call_agent(client, "GET", f"{settings.EVENT_AGENT_URL}/status/")
    if isinstance(result, dict) and "error" not in result:
        return [result]
    return []

# GET /demand/history — returns recent demand forecasts
@pipeline_router.get("/demand/history", status_code=status.HTTP_200_OK)
async def get_demand_history(client: httpx.AsyncClient = Depends(get_http_client)):
    from app.config import settings
    result = await services.call_agent(client, "GET", f"{settings.DEMAND_AGENT_URL}/forecast/")
    if isinstance(result, list):
        return result
    return []

# GET /pipeline/history — returns recent pipeline runs summary
@pipeline_router.get("/pipeline/history", status_code=status.HTTP_200_OK)
async def get_pipeline_history(client: httpx.AsyncClient = Depends(get_http_client)):
    from app.config import settings
    inventory = await services.call_agent(client, "GET", f"{settings.INVENTORY_AGENT_URL}/inventory/")
    if isinstance(inventory, list):
        return [{"type": "inventory_snapshot", "records": inventory[:10]}]
    return []
