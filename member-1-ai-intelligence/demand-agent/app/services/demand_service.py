import httpx
import json
import asyncio
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.demand import DemandPredictionRequest, DemandPredictionResponse
from app.services.predictor import DemandPredictor
from app.services.prompts import SYSTEM_DEMAND_EXPLANATION_PROMPT
from app.core.config import settings
from app.core.logger import logger

class DemandService:
    def __init__(self):
        self.predictor = DemandPredictor()

    async def _fetch_external_event_data(self, product: str, city: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Dict[str, Any]]:
        events = []
        weather = {}
        trends = {}
        try:
            url = f"{settings.EVENT_AGENT_URL}/event-score"
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(url, params={"product": product, "city": city})
                if res.status_code == 200:
                    data = res.json()
                    events = data.get("news", [])
                    weather = data.get("weather", {})
                    trends = data.get("trends", {})
                    if "analysis" in data and isinstance(data["analysis"], dict) and "error" not in data["analysis"]:
                        events.append(data["analysis"])
        except Exception as e:
            logger.warning("Could not reach Event Agent at %s: %s", settings.EVENT_AGENT_URL, str(e))
        return events, weather, trends

    async def _generate_ai_explanation(
        self,
        product_id: str,
        predicted_demand: float,
        inventory: float,
        recommended_order: float,
        sales_history: List[float],
        events: List[Dict[str, Any]],
        weather: Dict[str, Any],
        reasons: List[str]
    ) -> List[str]:
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key in ["your-gemini-api-key-here", "your_gemini_api_key_here"]:
            return reasons

        prompt = SYSTEM_DEMAND_EXPLANATION_PROMPT.format(
            product_id=product_id,
            predicted_demand=predicted_demand,
            inventory=inventory,
            recommended_order=recommended_order,
            sales_history=sales_history,
            events=events,
            weather=weather,
            reasons=reasons
        )

        try:
            from google import genai
            from google.genai import types

            def _call_gemini():
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                    )
                )
                return response.text.strip() if response and response.text else ""

            ai_text = await asyncio.to_thread(_call_gemini)
            if ai_text:
                ai_lines = [line.strip("- *").strip() for line in ai_text.splitlines() if line.strip()]
                if ai_lines:
                    return ai_lines[:4]
        except Exception as e:
            logger.warning("Gemini AI explanation failed: %s", str(e))

        return reasons

    async def predict_demand(self, request: DemandPredictionRequest) -> DemandPredictionResponse:
        logger.info("Processing demand prediction for product_id: %s", request.product_id)

        events = request.events or []
        weather = request.weather or {}
        trends = {}

        # Integrate with Event Agent if external events/weather are empty
        if not events and not weather and request.city:
            ext_events, ext_weather, ext_trends = await self._fetch_external_event_data(request.product_id, request.city)
            if ext_events:
                events = ext_events
            if ext_weather:
                weather = ext_weather
            if ext_trends:
                trends = ext_trends

        predicted_demand, confidence, recommended_order, reasons = self.predictor.calculate_prediction(
            product_id=request.product_id,
            inventory=request.inventory,
            sales_history=request.sales_history or [],
            events=events,
            weather=weather,
            trends=trends
        )

        # AI Explanation enhancement if configured
        final_reasons = await self._generate_ai_explanation(
            product_id=request.product_id,
            predicted_demand=predicted_demand,
            inventory=request.inventory,
            recommended_order=recommended_order,
            sales_history=request.sales_history or [],
            events=events,
            weather=weather,
            reasons=reasons
        )

        return DemandPredictionResponse(
            predicted_demand=predicted_demand,
            confidence=confidence,
            recommended_order=recommended_order,
            reasons=final_reasons
        )
