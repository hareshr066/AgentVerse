import httpx
import logging
import asyncio
from typing import Any, Dict, List, Optional
from app.config import settings

logger = logging.getLogger("orchestrator")

async def call_agent(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    json_data: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
    retries: int = 2
) -> Any:
    for attempt in range(retries + 1):
        try:
            logger.info("Calling agent URL: %s, attempt: %d", url, attempt + 1)
            response = await client.request(
                method,
                url,
                json=json_data,
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error("HTTP status error from agent %s: %s", url, str(e))
            if attempt == retries:
                return {"error": f"Agent returned status {e.response.status_code}", "detail": e.response.text}
        except httpx.RequestError as e:
            logger.error("Request error from agent %s: %s", url, str(e))
            if attempt == retries:
                return {"error": "Agent unreachable", "detail": str(e)}
    return {"error": "Unknown error calling agent"}

# 1. Inventory Check Workflow (Workflow 1)
async def run_inventory_check_workflow(client: httpx.AsyncClient, product_name: Optional[str] = None) -> Dict[str, Any]:
    logger.info("Starting Workflow 1: Inventory Check")
    inventory_res = await call_agent(client, "GET", f"{settings.INVENTORY_AGENT_URL}/inventory/")
    
    if "error" in inventory_res or not isinstance(inventory_res, list):
        return {
            "status": "failure",
            "message": "Could not retrieve inventory levels.",
            "inventory_data": inventory_res
        }
        
    items_checked = []
    low_stock_items = []
    
    for item in inventory_res:
        name = item.get("product_name", "")
        if product_name and product_name.lower() not in name.lower():
            continue
            
        current_stock = item.get("current_stock", 0)
        reorder_point = item.get("reorder_point", 0)
        
        status_info = {
            "id": item.get("id"),
            "product_name": name,
            "current_stock": current_stock,
            "reorder_point": reorder_point,
            "status": item.get("status")
        }
        items_checked.append(status_info)
        
        if current_stock < reorder_point:
            suppliers = await call_agent(client, "GET", f"{settings.SUPPLY_AGENT_URL}/suppliers/recommended")
            status_info["suppliers_recommended"] = suppliers
            low_stock_items.append(status_info)
            
    return {
        "status": "success",
        "total_checked": len(items_checked),
        "total_low_stock": len(low_stock_items),
        "items": items_checked,
        "low_stock_items": low_stock_items
    }

# 2. Procurement Workflow (Workflow 2)
async def run_procurement_workflow(client: httpx.AsyncClient, material_name: str, quantity_needed: int) -> Dict[str, Any]:
    logger.info("Starting Workflow 2: Procurement for %s", material_name)
    suppliers = await call_agent(client, "GET", f"{settings.SUPPLY_AGENT_URL}/suppliers/")
    
    matched_suppliers = []
    recommended_suppliers = []
    
    if isinstance(suppliers, list):
        for s in suppliers:
            if s.get("material_name", "").lower() == material_name.lower():
                matched_suppliers.append(s)
                if s.get("recommended", False):
                    recommended_suppliers.append(s)
                    
    inventory = await call_agent(client, "GET", f"{settings.INVENTORY_AGENT_URL}/inventory/")
    current_inventory_info = None
    if isinstance(inventory, list):
        for item in inventory:
            if item.get("product_name", "").lower() == material_name.lower():
                current_inventory_info = item
                break
                
    return {
        "material_name": material_name,
        "quantity_needed": quantity_needed,
        "current_inventory": current_inventory_info,
        "available_suppliers": matched_suppliers,
        "recommended_suppliers": recommended_suppliers if recommended_suppliers else matched_suppliers[:2]
    }

# 3. Manufacturing Planning Workflow (Workflow 3)
# Demand Agent -> Production Agent -> Inventory Agent -> Supply Agent -> Recommendation Agent
async def run_production_workflow(client: httpx.AsyncClient, plan_id: Optional[int] = None) -> Dict[str, Any]:
    logger.info("Starting Workflow 3: Manufacturing Planning")
    
    # Step A: Fetch Forecasts from Demand Agent
    demand_forecasts = await call_agent(client, "GET", f"{settings.DEMAND_AGENT_URL}/forecast/")
    
    # Step B: Fetch Production Plans from Production Agent
    prod_plans = await call_agent(
        client,
        "GET",
        f"{settings.PRODUCTION_AGENT_URL}/production-plans/{plan_id}" if plan_id else f"{settings.PRODUCTION_AGENT_URL}/production-plans/"
    )
    
    if "error" in prod_plans:
        prod_plans = [{"id": plan_id or 1, "product_name": "Standard Steel Sheets", "quantity": 1000, "status": "PLANNED", "materials_needed": ["Iron Ore", "Coal"]}]
        
    results = []
    for plan in prod_plans if isinstance(prod_plans, list) else [prod_plans]:
        materials_status = []
        materials_needed = plan.get("materials_needed", ["Raw Iron", "Carbon Alloy"])
        
        for material in materials_needed:
            # Step C: Query Inventory Agent for material
            inv_item = None
            inventory = await call_agent(client, "GET", f"{settings.INVENTORY_AGENT_URL}/inventory/")
            if isinstance(inventory, list):
                for item in inventory:
                    if item.get("product_name", "").lower() == material.lower():
                        inv_item = item
                        break
            
            # Step D: Query Supply Agent for suppliers
            suppliers = await call_agent(client, "GET", f"{settings.SUPPLY_AGENT_URL}/suppliers/")
            matched_suppliers = []
            if isinstance(suppliers, list):
                matched_suppliers = [s for s in suppliers if s.get("material_name", "").lower() == material.lower()]
                
            materials_status.append({
                "material_name": material,
                "inventory": inv_item or {"status": "Not Found", "current_stock": 0},
                "suppliers": matched_suppliers
            })
            
        # Step E: Send telemetry to Recommendation Agent to analyze recommendations
        recommendation_payload = {
            "demand_forecasts": demand_forecasts,
            "production_plan": plan,
            "materials_status": materials_status
        }
        ai_recommendation = await call_agent(
            client,
            "POST",
            f"{settings.RECOMMENDATION_AGENT_URL}/recommendations/analyze",
            json_data=recommendation_payload
        )
        
        results.append({
            "production_plan": plan,
            "materials_status": materials_status,
            "recommendation": ai_recommendation
        })
        
    return {
        "status": "success",
        "demand_forecasts": demand_forecasts,
        "production_workflow_results": results
    }

# 4. External Event Analysis Workflow (Workflow 4)
# Event Agent -> Demand Agent -> Recommendation Agent
async def run_event_analysis_workflow(client: httpx.AsyncClient, product: str, city: str) -> Dict[str, Any]:
    logger.info("Starting Workflow 4: External Event Analysis")
    
    event_data = await call_agent(client, "GET", f"{settings.EVENT_AGENT_URL}/event-score", params={"product": product, "city": city})
    demand_forecasts = await call_agent(client, "GET", f"{settings.DEMAND_AGENT_URL}/forecast/")
    
    recommendation_payload = {
        "event_context": event_data,
        "demand_forecasts": demand_forecasts
    }
    
    ai_recommendation = await call_agent(
        client,
        "POST",
        f"{settings.RECOMMENDATION_AGENT_URL}/recommendations/analyze",
        json_data=recommendation_payload
    )
    
    return {
        "status": "success",
        "event_analysis": event_data,
        "demand_forecasts": demand_forecasts,
        "business_impact_analysis": ai_recommendation
    }

# 5. Full Analysis Workflow (Workflow 5)
async def run_full_analysis_workflow(client: httpx.AsyncClient, product: str, city: str) -> Dict[str, Any]:
    logger.info("Starting Workflow 5: Full Analysis")
    
    tasks = [
        call_agent(client, "GET", f"{settings.EVENT_AGENT_URL}/event-score", params={"product": product, "city": city}),
        call_agent(client, "GET", f"{settings.DEMAND_AGENT_URL}/forecast/"),
        call_agent(client, "GET", f"{settings.INVENTORY_AGENT_URL}/inventory/"),
        call_agent(client, "GET", f"{settings.SUPPLY_AGENT_URL}/suppliers/"),
        call_agent(client, "GET", f"{settings.PRODUCTION_AGENT_URL}/production-plans/"),
    ]
    
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    event_data = responses[0] if not isinstance(responses[0], Exception) else {"error": "Failed calling Event Agent"}
    demand_data = responses[1] if not isinstance(responses[1], Exception) else {"error": "Failed calling Demand Agent"}
    inventory_data = responses[2] if not isinstance(responses[2], Exception) else {"error": "Failed calling Inventory Agent"}
    supply_data = responses[3] if not isinstance(responses[3], Exception) else {"error": "Failed calling Supply Agent"}
    production_data = responses[4] if not isinstance(responses[4], Exception) else {"error": "Failed calling Production Agent"}
    
    recommendation_payload = {
        "event_context": event_data,
        "demand_forecasts": demand_data,
        "inventory": inventory_data,
        "suppliers": supply_data,
        "production_plans": production_data
    }
    
    recommendation = await call_agent(
        client,
        "POST",
        f"{settings.RECOMMENDATION_AGENT_URL}/recommendations/analyze",
        json_data=recommendation_payload
    )
    
    return {
        "timestamp": str(asyncio.get_event_loop().time()),
        "parameters": {"product": product, "city": city},
        "event_analysis": event_data,
        "demand_forecast": demand_data,
        "inventory_status": inventory_data,
        "supply_status": supply_data,
        "production_status": production_data,
        "overall_recommendation": recommendation
    }

# 6. Health Aggregator (Step 9)
async def get_health_status(client: httpx.AsyncClient) -> Dict[str, Any]:
    logger.info("Aggregating health monitoring statuses...")
    
    # Ping status/health endpoint for each agent
    tasks = [
        call_agent(client, "GET", f"{settings.EVENT_AGENT_URL}/status/"),
        call_agent(client, "GET", f"{settings.DEMAND_AGENT_URL}/"),
        call_agent(client, "GET", f"{settings.INVENTORY_AGENT_URL}/health"),
        call_agent(client, "GET", f"{settings.SUPPLY_AGENT_URL}/health"),
        call_agent(client, "GET", f"{settings.PRODUCTION_AGENT_URL}/"),
        call_agent(client, "GET", f"{settings.RECOMMENDATION_AGENT_URL}/"),
    ]
    
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    def parse_health(res: Any) -> str:
        if isinstance(res, dict) and "error" not in res:
            return "healthy"
        return "unhealthy"

    event_health = parse_health(responses[0])
    demand_health = parse_health(responses[1])
    inventory_health = parse_health(responses[2])
    supply_health = parse_health(responses[3])
    production_health = parse_health(responses[4])
    recommendation_health = parse_health(responses[5])
    
    # Determine DB status based on Inventory/Supply agents since they hit DB
    db_status = "healthy"
    for r in [responses[2], responses[3]]:
        if isinstance(r, dict) and r.get("detail") == "Database fetch failed.":
            db_status = "unhealthy"
            
    agents_status = [event_health, demand_health, inventory_health, supply_health, production_health, recommendation_health]
    overall_status = "healthy" if all(s == "healthy" for s in agents_status) and db_status == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "services": {
            "orchestrator": "healthy",
            "event_agent": event_health,
            "demand_agent": demand_health,
            "inventory_agent": inventory_health,
            "supply_agent": supply_health,
            "production_agent": production_health,
            "recommendation_agent": recommendation_health,
            "database": db_status
        }
    }
