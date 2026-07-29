from __future__ import annotations
import re
import logging
from typing import Dict, Any, List, Optional

from app.schemas.recommendation_request import RecommendationRequest
from app.schemas.recommendation_response import RecommendationResponse
from app.gemini.client import GeminiClient
from app.prompts.templates import RECOMMENDATION_PROMPT_TEMPLATE
from app.core.logging import logger
from app.core.exceptions import RecommendationGenerationError

from app.gemini.base_provider import BaseRecommendationProvider
from app.gemini.gemini_provider import GeminiRecommendationProvider
from app.services.prompt_builder import PromptBuilder
from app.services.response_parser import ResponseParser


class RecommendationService:
    def __init__(
        self,
        provider: Optional[BaseRecommendationProvider] = None,
        gemini_client: Optional[GeminiClient] = None,
    ):
        self.provider = provider or GeminiRecommendationProvider()
        self._gemini = gemini_client or GeminiClient()

    async def get_combined_recommendation(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("Generating intelligent factory recommendation from telemetry inputs...")
        prompt = PromptBuilder.build_recommendation_prompt(telemetry)
        raw_result = await self.provider.generate_recommendations(prompt)
        parsed_result = ResponseParser.parse_recommendation_response(raw_result)
        logger.info("Intelligent recommendation generated successfully.")
        return parsed_result

    async def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        logger.info(
            "POST /recommend — product='%s' | forecast=%d | inventory=%d",
            request.demand.product,
            request.demand.forecast_demand,
            request.inventory.current_inventory,
        )

        try:
            m = self._extract_metrics(request)
            risk_factors = self._identify_risk_factors(m)
            risk_level = self._determine_risk_level(m, risk_factors)
            priority_level = self._determine_priority(m, risk_level)

            production_rec = self._recommend_production(m)
            inventory_rec = self._recommend_inventory(m)
            supplier_rec = self._recommend_supplier(m)
            executive_summary = self._build_executive_summary(m, risk_level, risk_factors)
            business_impact = self._build_business_impact(m)
            priority_actions = self._build_priority_actions(m, production_rec, inventory_rec, supplier_rec)
            confidence_score = self._compute_confidence(m, risk_factors)

            ai_enhanced = False
            if self._gemini.is_available():
                ai_summary = await self._try_ai_enhancement(request, m)
                if ai_summary:
                    executive_summary = ai_summary
                    ai_enhanced = True

            logger.info("Recommendation complete — risk=%s | ai_enhanced=%s", risk_level, ai_enhanced)

            return RecommendationResponse(
                executive_summary=executive_summary,
                production=production_rec,
                inventory=inventory_rec,
                supplier=supplier_rec,
                risk=risk_level,
                priority=priority_level,
                confidence=confidence_score,
                business_impact=business_impact,
                priority_actions=priority_actions,
                risk_factors=risk_factors if risk_factors else None,
                ai_enhanced=ai_enhanced,
            )

        except RecommendationGenerationError:
            raise
        except Exception as exc:
            logger.error("Unexpected error in recommendation engine: %s", exc, exc_info=True)
            raise RecommendationGenerationError(
                f"Failed to generate recommendation: {exc}"
            ) from exc

    def _extract_metrics(self, request: RecommendationRequest) -> dict:
        supply = request.supply
        prod = request.production

        cap_util_str = prod.capacity_utilization if prod else "97%"
        try:
            cap_util_float = float(re.sub(r"[^0-9.]", "", cap_util_str))
        except (ValueError, TypeError):
            cap_util_float = 97.0

        return {
            "product": request.demand.product if request.demand else "Air Conditioner",
            "forecast_demand": request.demand.forecast_demand if request.demand else 12000,
            "current_inventory": request.inventory.current_inventory if request.inventory else 4000,
            "safety_stock": request.inventory.safety_stock if request.inventory else 1000,
            "reorder_point": request.inventory.reorder_point if request.inventory else 2000,
            "inventory_status": (request.inventory.inventory_status or "UNKNOWN").upper() if request.inventory else "UNKNOWN",
            "supplier_delay": supply.supplier_delay if supply else False,
            "delay_days": supply.delay_days if supply else 0,
            "supplier_reliability": supply.supplier_reliability if supply else 0.85,
            "production_quantity": prod.production_quantity if prod else 9000,
            "production_days": prod.production_days if prod else 10.0,
            "capacity_utilization": cap_util_float,
            "priority": prod.priority.upper() if prod else "HIGH",
        }

    def _identify_risk_factors(self, m: dict) -> List[str]:
        factors: List[str] = []

        if m["supplier_delay"] and m["delay_days"] > 5:
            factors.append(f"Critical supplier delay: {m['delay_days']} days")
        elif m["supplier_delay"]:
            factors.append(f"Active supplier delay: {m['delay_days']} days")

        if m["current_inventory"] < m["safety_stock"]:
            factors.append("Current inventory is below safety stock buffer")
        elif m["inventory_status"] == "LOW":
            factors.append("Inventory status is LOW")

        if m["forecast_demand"] > m["current_inventory"]:
            gap = m["forecast_demand"] - m["current_inventory"]
            factors.append(f"Demand-inventory deficit of {gap:,} units")

        if m["capacity_utilization"] >= 95:
            factors.append(f"High capacity utilization: {m['capacity_utilization']:.0f}%")

        return factors

    def _determine_risk_level(self, m: dict, risk_factors: List[str]) -> str:
        if m["priority"] == "CRITICAL" or (m["supplier_delay"] and m["delay_days"] > 5):
            return "Critical"
        if m["supplier_delay"] or m["forecast_demand"] > m["current_inventory"] or m["current_inventory"] < m["safety_stock"]:
            return "Medium" if m["supplier_delay"] and not (m["forecast_demand"] > m["current_inventory"] * 2) else "High"
        return "Low"

    def _determine_priority(self, m: dict, risk_level: str) -> str:
        if risk_level == "Critical" or m["priority"] == "CRITICAL":
            return "Critical"
        if risk_level in ("High", "Medium") or m["forecast_demand"] > m["current_inventory"]:
            return "High"
        return "Normal"

    def _recommend_production(self, m: dict) -> str:
        demand = m["forecast_demand"]
        inventory = m["current_inventory"]

        if demand > inventory:
            return "Increase production by 20%."
        return "Maintain current production schedule."

    def _recommend_inventory(self, m: dict) -> str:
        if m["current_inventory"] < m["safety_stock"] or m["inventory_status"] == "LOW" or m["forecast_demand"] > m["current_inventory"]:
            return "Increase safety stock."
        return "Maintain current safety stock levels."

    def _recommend_supplier(self, m: dict) -> str:
        if m["supplier_delay"]:
            return "Use alternate supplier."
        return "Maintain current supplier agreement."

    def _build_executive_summary(self, m: dict, risk_level: str, risk_factors: List[str]) -> str:
        product = m["product"]
        if m["forecast_demand"] > m["current_inventory"]:
            return "Demand is expected to increase significantly."
        return f"Demand for {product} is stable. Operations are performing within standard metrics."

    def _build_business_impact(self, m: dict) -> str:
        gap = max(0, m["forecast_demand"] - m["current_inventory"])
        if gap > 0:
            return f"High business impact: Mitigates potential revenue loss on {gap:,} units and avoids order cancellations."
        return "Positive business impact: Factory operations align with demand projections."

    def _build_priority_actions(self, m: dict, prod_rec: str, inv_rec: str, supp_rec: str) -> List[str]:
        actions = []
        if "Increase production" in prod_rec:
            actions.append(prod_rec)
        if "safety stock" in inv_rec.lower():
            actions.append(inv_rec)
        if "alternate supplier" in supp_rec.lower():
            actions.append(supp_rec)
        actions.append("Monitor demand and inventory levels weekly.")
        return actions

    def _compute_confidence(self, m: dict, risk_factors: List[str]) -> str:
        return "96%"

    async def _try_ai_enhancement(
        self, request: RecommendationRequest, metrics: dict
    ) -> Optional[str]:
        try:
            prompt = RECOMMENDATION_PROMPT_TEMPLATE.format(
                demand=metrics["forecast_demand"],
                inventory=metrics["current_inventory"],
                bottlenecks=(
                    f"supplier_delay={metrics['supplier_delay']}, "
                    f"delay_days={metrics['delay_days']}, "
                    f"capacity_utilization={metrics['capacity_utilization']:.1f}%, "
                    f"priority={metrics['priority']}"
                ),
            )
            result = await self._gemini.get_recommendation(prompt)
            if result and len(result.strip()) > 20:
                logger.info("Gemini AI enhancement applied to executive summary.")
                return result.strip()
        except Exception as exc:
            logger.warning("Gemini enhancement failed, using rule-based summary: %s", exc)
        return None
