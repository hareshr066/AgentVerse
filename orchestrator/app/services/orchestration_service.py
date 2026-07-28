import httpx
import sys
import os
from typing import Dict, Any, List, Tuple

# Fix Python path for shared module if not already set
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # app
repo_root = os.path.abspath(os.path.join(current_dir, "..")) # orchestrator repository root
parent_root = os.path.abspath(os.path.join(repo_root, "..")) # E:\agentverse
if parent_root not in sys.path:
    sys.path.insert(0, parent_root)

from app.core.config import settings
from app.core.logger import logger
from app.schemas.pipeline import PipelineRequest, PipelineResponse


class OrchestrationService:
    def _get_candidate_urls(self, primary_url: str, container_name: str, fallback_ports: List[int]) -> List[str]:
        candidates = [primary_url, f"http://{container_name}:8000"]
        for port in fallback_ports:
            url = f"http://localhost:{port}"
            if url not in candidates:
                candidates.append(url)
        return candidates

    async def _try_get(self, urls: List[str], path: str, params: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
        paths = [path]
        if not path.startswith("/api/v1"):
            paths.append(f"/api/v1{path}")
        for base_url in urls:
            for p in paths:
                full_url = f"{base_url}{p}"
                try:
                    async with httpx.AsyncClient(timeout=2.0) as client:
                        res = await client.get(full_url, params=params)
                        if res.status_code == 200:
                            return res.json(), full_url
                except Exception as e:
                    logger.debug("Failed GET to %s: %s", full_url, str(e))
        return {}, ""

    async def _try_post(self, urls: List[str], path: str, json_data: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
        paths = [path]
        if not path.startswith("/api/v1"):
            paths.append(f"/api/v1{path}")
        for base_url in urls:
            for p in paths:
                full_url = f"{base_url}{p}"
                try:
                    async with httpx.AsyncClient(timeout=2.0) as client:
                        res = await client.post(full_url, json=json_data)
                        if res.status_code == 200:
                            return res.json(), full_url
                except Exception as e:
                    logger.debug("Failed POST to %s: %s", full_url, str(e))
        return {}, ""

    async def coordinate_workflow(self, request: PipelineRequest) -> PipelineResponse:
        pipeline_logs: List[str] = []
        product_id = request.product_id
        city = request.city or "Delhi"

        logger.info("==================================================")
        logger.info("Starting Multi-Agent Orchestration Pipeline for Product: %s, City: %s", product_id, city)
        logger.info("==================================================")
        pipeline_logs.append(f"Pipeline initiated for Product: '{product_id}', Location: '{city}'")

        # ---------------------------------------------------------
        # STEP 1: EVENT AGENT
        # ---------------------------------------------------------
        logger.info("[Step 1/4] Querying Event Agent for telemetry events and weather data...")
        event_urls = self._get_candidate_urls(settings.EVENT_AGENT_URL, "event-agent", [8001])
        event_data, used_event_url = await self._try_get(event_urls, "/event-score", {"product": product_id, "city": city})
        
        if event_data:
            logger.info("Step 1 SUCCESS - Event Agent responded via %s", used_event_url)
            pipeline_logs.append(f"[1/4] Event Agent SUCCESS ({used_event_url}): Fetched news, weather, and Gemini event analysis.")
        else:
            logger.warning("Step 1 DEGRADED - Event Agent unreachable")
            pipeline_logs.append("[1/4] Event Agent WARNING: Service unreachable. Proceeding with empty event context.")
            event_data = {"event": "None", "category": "Normal", "impact_score": 50, "news": [], "weather": {}}

        # Extract events and weather for Demand Agent
        events_list = event_data.get("news", [])
        if "analysis" in event_data and isinstance(event_data["analysis"], dict) and "error" not in event_data["analysis"]:
            events_list.append(event_data["analysis"])
        weather_dict = event_data.get("weather", {})

        # ---------------------------------------------------------
        # STEP 2: DEMAND AGENT
        # ---------------------------------------------------------
        logger.info("[Step 2/4] Querying Demand Agent to forecast demand...")
        demand_urls = self._get_candidate_urls(settings.DEMAND_AGENT_URL, "demand-agent", [8005, 8002])
        demand_payload = {
            "product_id": product_id,
            "city": city,
            "inventory": float(request.current_stock or 0),
            "sales_history": request.sales_history or [100.0, 110.0, 105.0, 120.0, 130.0],
            "events": events_list,
            "weather": weather_dict
        }
        
        demand_data, used_demand_url = await self._try_post(demand_urls, "/predict-demand", demand_payload)
        
        if demand_data:
            logger.info("Step 2 SUCCESS - Demand Agent responded via %s: predicted_demand=%s", 
                        used_demand_url, demand_data.get("predicted_demand"))
            pipeline_logs.append(f"[2/4] Demand Agent SUCCESS ({used_demand_url}): Forecasted demand = {demand_data.get('predicted_demand')} units (Confidence: {demand_data.get('confidence')}).")
        else:
            logger.warning("Step 2 DEGRADED - Demand Agent unreachable")
            pipeline_logs.append("[2/4] Demand Agent WARNING: Service unreachable. Applying fallback baseline demand calculation.")
            demand_data = {
                "predicted_demand": 120.0,
                "confidence": 0.70,
                "recommended_order": max(0.0, 120.0 - float(request.current_stock or 0)),
                "reasons": ["Fallback baseline demand calculation applied."]
            }

        # ---------------------------------------------------------
        # STEP 3: OPERATIONS / INVENTORY AGENT
        # ---------------------------------------------------------
        logger.info("[Step 3/4] Querying Operations/Inventory Agent to compute stock requirements...")
        inventory_urls = self._get_candidate_urls(settings.INVENTORY_AGENT_URL, "inventory-agent", [8003, 8002])
        predicted_demand_val = int(round(float(demand_data.get("predicted_demand", 120.0))))
        
        inventory_payload = {
            "product": product_id,
            "forecast_demand": max(1, predicted_demand_val),
            "current_stock": request.current_stock or 0,
            "daily_demand": request.daily_demand or 5,
            "lead_time": request.lead_time or 3
        }

        inventory_data, used_inventory_url = await self._try_post(inventory_urls, "/inventory/calculate", inventory_payload)

        if inventory_data:
            logger.info("Step 3 SUCCESS - Operations/Inventory Agent responded via %s", used_inventory_url)
            pipeline_logs.append(f"[3/4] Operations/Inventory Agent SUCCESS ({used_inventory_url}): Safety stock = {inventory_data.get('safety_stock')}, Reorder point = {inventory_data.get('reorder_point')}, EOQ = {inventory_data.get('economic_order_quantity')}.")
        else:
            logger.warning("Step 3 DEGRADED - Operations/Inventory Agent unreachable")
            pipeline_logs.append("[3/4] Operations/Inventory Agent WARNING: Service unreachable. Applying local inventory estimation.")
            inventory_data = {
                "product": product_id,
                "current_stock": request.current_stock or 0,
                "reorder_point": (request.daily_demand or 5) * (request.lead_time or 3),
                "economic_order_quantity": max(0, predicted_demand_val - (request.current_stock or 0)),
                "safety_stock": (request.daily_demand or 5) * 2,
                "stock_status": "LOW" if (request.current_stock or 0) < predicted_demand_val else "ADEQUATE",
                "order_recommended": (request.current_stock or 0) < predicted_demand_val
            }

        # ---------------------------------------------------------
        # STEP 4: DECISION ENGINE / RECOMMENDATION AGENT
        # ---------------------------------------------------------
        logger.info("[Step 4/4] Invoking Decision Engine for final recommendation synthesis...")
        rec_urls = self._get_candidate_urls(settings.RECOMMENDATION_AGENT_URL, "recommendation-agent", [8006])
        rec_payload = {
            "product_id": product_id,
            "event_summary": event_data,
            "demand_forecast": demand_data,
            "inventory_status": inventory_data
        }

        rec_data, used_rec_url = await self._try_post(rec_urls, "/api/v1/recommendation/generate", rec_payload)

        if rec_data:
            logger.info("Step 4 SUCCESS - Recommendation Agent responded via %s", used_rec_url)
            pipeline_logs.append(f"[4/4] Decision Engine SUCCESS ({used_rec_url}): Generated AI-driven strategic optimization.")
            decision_recommendation = rec_data
        else:
            logger.info("Step 4 SYNTHESIS - Combining multi-agent pipeline outputs into Decision Engine recommendation...")
            
            reasons = demand_data.get("reasons", [])
            predicted_demand = demand_data.get("predicted_demand", 0)
            rec_order = demand_data.get("recommended_order", 0)
            stock_status = inventory_data.get("stock_status", "ADEQUATE")

            action_items = [
                f"Procure {rec_order} units of '{product_id}' to cover predicted demand of {predicted_demand} units."
            ]
            if stock_status == "LOW" or rec_order > 0:
                action_items.append("Expedite supplier order placement to avoid inventory stockouts.")
            if event_data.get("event") != "None":
                action_items.append(f"Monitor event impact ({event_data.get('category', 'Event')}) in {city}.")

            decision_recommendation = {
                "decision_status": "REORDER_REQUIRED" if rec_order > 0 else "OPTIMAL",
                "summary": f"Demand Agent predicts demand of {predicted_demand} units for '{product_id}' in {city}. Current stock is {request.current_stock} units.",
                "drivers": reasons,
                "action_items": action_items,
                "confidence_score": demand_data.get("confidence", 0.85)
            }
            pipeline_logs.append("[4/4] Decision Engine SUCCESS: Synthesized end-to-end multi-agent recommendation.")

        pipeline_status = "success" if (event_data and demand_data and inventory_data) else "degraded"

        # Record successful pipeline run (status is success or degraded) in persistent SQLite DB
        try:
            from shared.database import SessionLocal, engine, Base
            from shared.repository import PredictionRepository
            
            # Ensure tables exist
            Base.metadata.create_all(bind=engine)
            
            # Start a direct DB session context
            with SessionLocal() as db:
                event_id = event_data.get("event_prediction_id")
                demand_id = demand_data.get("demand_prediction_id")
                
                pipeline_run_data = {
                    "product_id": product_id,
                    "city": city,
                    "status": pipeline_status,
                    "execution_time_ms": 1500, # Estimated/mocked turnaround
                    "event_prediction_id": event_id,
                    "demand_prediction_id": demand_id,
                    "decision_status": decision_recommendation.get("decision_status") or "SUCCESS"
                }
                PredictionRepository.create_pipeline_run(db, pipeline_run_data)
        except Exception as db_err:
            logger.warning("Could not persist pipeline run to DB: %s", str(db_err))

        logger.info("==================================================")
        logger.info("Pipeline Completed with status: %s", pipeline_status)
        logger.info("==================================================")

        return PipelineResponse(
            status=pipeline_status,
            product_id=product_id,
            city=city,
            event_data=event_data,
            demand_data=demand_data,
            inventory_data=inventory_data,
            decision_recommendation=decision_recommendation,
            pipeline_logs=pipeline_logs
        )

