"""
Recommendation Agent - RecommendationService

Core service that generates executive recommendations by analysing data
from all four upstream agents (Demand, Inventory, Supply, Production).

Architecture:
    1. Rule-based engine runs first — always produces a valid output.
    2. If GeminiClient is available (GEMINI_API_KEY set), the AI layer
       is called to enhance the executive_summary.
    3. The interface never changes regardless of whether AI is active,
       so enabling/disabling Gemini requires only an env-var change.

Rule logic:
    Risk level  →  CRITICAL  : supplier_delay AND delay_days > 5
                   HIGH      : forecast_demand > current_inventory
                               OR inventory_status == "LOW"
                               OR capacity_utilization >= 95 %
                   MEDIUM    : supplier_delay OR capacity_utilization >= 80 %
                   LOW       : all conditions normal

    Production  →  if forecast_demand > current_inventory : suggest ramp-up %
                   if capacity near max               : suggest extra shift
                   else                               : maintain current pace

    Inventory   →  if current_inventory < safety_stock : immediate replenish
                   if current_inventory < reorder_point: schedule replenish
                   else                                : maintain healthy level

    Supplier    →  if supplier_delay AND delay_days > 5 : activate secondary
                   if supplier_delay                    : monitor closely
                   else                                 : no action required
"""

from __future__ import annotations

import re
from typing import List, Optional

from app.schemas.recommendation_request import RecommendationRequest
from app.schemas.recommendation_response import RecommendationResponse
from app.gemini.client import GeminiClient
from app.prompts.templates import RECOMMENDATION_PROMPT_TEMPLATE
from app.core.logging import logger
from app.core.exceptions import RecommendationGenerationError


class RecommendationService:
    """
    Generates holistic manufacturing recommendations from upstream agent data.

    Usage:
        service = RecommendationService()
        response = await service.recommend(request)
    """

    def __init__(self, gemini_client: Optional[GeminiClient] = None) -> None:
        # Gemini is injected so it can be mocked in tests or swapped later.
        # If not provided, a new client is created (uses GEMINI_API_KEY env var).
        self._gemini = gemini_client or GeminiClient()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """
        Produce a RecommendationResponse from the aggregated agent data.

        Steps:
            1. Extract key metrics from the request
            2. Identify risk factors
            3. Determine overall risk level
            4. Build rule-based recommendations for each dimension
            5. Attempt Gemini AI enhancement of the executive summary
            6. Return assembled RecommendationResponse

        Args:
            request: Validated RecommendationRequest from the API layer.

        Returns:
            RecommendationResponse with all five recommendation dimensions.

        Raises:
            RecommendationGenerationError: If the rule engine fails unexpectedly.
        """
        logger.info(
            "Generating recommendations for product='%s' | "
            "forecast=%d | inventory=%d | priority=%s",
            request.demand.product,
            request.demand.forecast_demand,
            request.inventory.current_inventory,
            request.production.priority,
        )

        try:
            # ── Step 1: Extract metrics ────────────────────────────────
            metrics = self._extract_metrics(request)

            # ── Step 2: Identify risk factors ──────────────────────────
            risk_factors = self._identify_risk_factors(metrics)

            # ── Step 3: Overall risk level ─────────────────────────────
            risk_level = self._determine_risk_level(metrics, risk_factors)

            # ── Step 4: Rule-based recommendations ─────────────────────
            production_rec = self._recommend_production(metrics)
            inventory_rec = self._recommend_inventory(metrics)
            supplier_rec = self._recommend_supplier(metrics)
            executive_summary = self._build_executive_summary(
                metrics, risk_level, risk_factors
            )

            # ── Step 5: Optional Gemini AI enhancement ─────────────────
            ai_enhanced = False
            if self._gemini.is_available():
                ai_summary = await self._try_ai_enhancement(request, metrics)
                if ai_summary:
                    executive_summary = ai_summary
                    ai_enhanced = True

            logger.info(
                "Recommendation complete — risk=%s | ai_enhanced=%s",
                risk_level,
                ai_enhanced,
            )

            return RecommendationResponse(
                executive_summary=executive_summary,
                production=production_rec,
                inventory=inventory_rec,
                supplier=supplier_rec,
                risk=risk_level,
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

    # ------------------------------------------------------------------
    # Metric extraction
    # ------------------------------------------------------------------

    def _extract_metrics(self, request: RecommendationRequest) -> dict:
        """Flatten nested request into a single metrics dict for easy rule evaluation."""
        supply = request.supply

        # Parse capacity utilization float from string like "96.67%"
        cap_util_str = request.production.capacity_utilization
        try:
            cap_util_float = float(re.sub(r"[^0-9.]", "", cap_util_str))
        except (ValueError, TypeError):
            cap_util_float = 0.0

        return {
            "product": request.demand.product,
            "forecast_demand": request.demand.forecast_demand,
            "current_inventory": request.inventory.current_inventory,
            "safety_stock": request.inventory.safety_stock,
            "reorder_point": request.inventory.reorder_point,
            "inventory_status": (request.inventory.inventory_status or "UNKNOWN").upper(),
            "supplier_delay": supply.supplier_delay if supply else False,
            "delay_days": supply.delay_days if supply else 0,
            "supplier_reliability": supply.supplier_reliability if supply else None,
            "production_quantity": request.production.production_quantity,
            "production_days": request.production.production_days,
            "capacity_utilization": cap_util_float,
            "priority": request.production.priority.upper(),
        }

    # ------------------------------------------------------------------
    # Risk analysis
    # ------------------------------------------------------------------

    def _identify_risk_factors(self, m: dict) -> List[str]:
        """Build a list of individual risk factors present in the data."""
        factors: List[str] = []

        if m["supplier_delay"] and m["delay_days"] > 5:
            factors.append(f"Critical supplier delay: {m['delay_days']} days")
        elif m["supplier_delay"]:
            factors.append(f"Active supplier delay: {m['delay_days']} days")

        if m["current_inventory"] < m["safety_stock"]:
            factors.append("Inventory below safety stock threshold")
        elif m["inventory_status"] == "LOW":
            factors.append("Inventory status is LOW")

        if m["reorder_point"] and m["current_inventory"] < m["reorder_point"]:
            factors.append("Inventory below reorder point")

        if m["forecast_demand"] > m["current_inventory"]:
            gap = m["forecast_demand"] - m["current_inventory"]
            factors.append(f"Demand-inventory gap: {gap:,} units")

        if m["capacity_utilization"] >= 95:
            factors.append(f"High capacity utilization: {m['capacity_utilization']:.1f}%")

        if m["priority"] == "CRITICAL":
            factors.append("Production priority is CRITICAL")

        if m["supplier_reliability"] is not None and m["supplier_reliability"] < 0.7:
            factors.append(
                f"Low supplier reliability: {m['supplier_reliability'] * 100:.0f}%"
            )

        logger.info("Risk factors identified: %s", factors)
        return factors

    def _determine_risk_level(self, m: dict, risk_factors: List[str]) -> str:
        """Map identified risk factors to an overall risk level."""
        if m["priority"] == "CRITICAL" or (m["supplier_delay"] and m["delay_days"] > 5):
            return "Critical"

        high_conditions = [
            m["forecast_demand"] > m["current_inventory"],
            m["inventory_status"] == "LOW",
            m["current_inventory"] < m["safety_stock"],
            m["capacity_utilization"] >= 95,
        ]
        if any(high_conditions):
            return "High"

        medium_conditions = [
            m["supplier_delay"],
            m["capacity_utilization"] >= 80,
            m["reorder_point"] and m["current_inventory"] < m["reorder_point"],
        ]
        if any(medium_conditions):
            return "Medium"

        return "Low"

    # ------------------------------------------------------------------
    # Rule-based recommendations
    # ------------------------------------------------------------------

    def _recommend_production(self, m: dict) -> str:
        """Generate a production-specific recommendation."""
        demand = m["forecast_demand"]
        inventory = m["current_inventory"]
        cap_util = m["capacity_utilization"]
        priority = m["priority"]

        if priority == "CRITICAL":
            return (
                "URGENT: Activate emergency production schedule immediately. "
                "Run additional shifts to meet critical demand requirements."
            )

        if demand > inventory:
            gap = demand - inventory
            increase_pct = round((gap / inventory) * 100) if inventory > 0 else 100
            increase_pct = min(increase_pct, 50)  # cap suggestion at 50%
            return (
                f"Increase production output by approximately {increase_pct}% to close "
                f"the {gap:,}-unit demand-inventory gap within the planning period."
            )

        if cap_util >= 95:
            return (
                "Capacity utilization is near maximum. "
                "Consider adding an extra shift or scheduling overtime to sustain output "
                "without over-stressing equipment."
            )

        if cap_util >= 80:
            return (
                "Maintain current production pace. "
                "Monitor capacity utilization closely — proactively plan for additional "
                "capacity if demand increases further."
            )

        return (
            "Current production levels are adequate. "
            "Maintain the existing schedule and review in the next planning cycle."
        )

    def _recommend_inventory(self, m: dict) -> str:
        """Generate an inventory management recommendation."""
        current = m["current_inventory"]
        safety = m["safety_stock"]
        reorder = m["reorder_point"]
        status = m["inventory_status"]

        if current < safety:
            shortfall = safety - current
            return (
                f"URGENT: Current inventory ({current:,} units) is {shortfall:,} units "
                f"below the safety stock threshold ({safety:,} units). "
                "Initiate an emergency replenishment order immediately."
            )

        if reorder and current < reorder:
            return (
                f"Inventory ({current:,} units) is below the reorder point ({reorder:,} units). "
                "Schedule a replenishment order now to avoid a stockout before the next delivery."
            )

        if status == "LOW":
            return (
                "Inventory level is LOW. "
                "Increase safety stock to provide a larger buffer against demand surges "
                "and supplier variability."
            )

        if status == "MEDIUM":
            return (
                "Inventory is at a medium level. "
                "Monitor closely and consider placing a pre-emptive order to "
                "build buffer ahead of the peak demand period."
            )

        return (
            "Inventory is at a healthy level. "
            "Continue standard replenishment cycles and review safety stock "
            "levels quarterly."
        )

    def _recommend_supplier(self, m: dict) -> str:
        """Generate a supplier / procurement recommendation."""
        delay = m["supplier_delay"]
        days = m["delay_days"]
        reliability = m["supplier_reliability"]

        if delay and days > 5:
            return (
                f"CRITICAL: Supplier delay of {days} days exceeds the acceptable threshold. "
                "Activate a secondary supplier immediately and negotiate expedited delivery "
                "to prevent a production stoppage."
            )

        if delay:
            return (
                f"Active supplier delay of {days} days detected. "
                "Monitor shipment status daily and prepare contingency stock from "
                "an alternative supplier if the delay extends beyond 5 days."
            )

        if reliability is not None and reliability < 0.7:
            return (
                f"Supplier reliability is low ({reliability * 100:.0f}%). "
                "Evaluate alternative suppliers and consider dual-sourcing to reduce "
                "supply chain risk."
            )

        if reliability is not None and reliability < 0.85:
            return (
                "Supplier reliability is acceptable but below the preferred threshold. "
                "Communicate performance expectations and schedule a supplier review meeting."
            )

        return (
            "No active supplier delays. "
            "Continue standard procurement processes and maintain regular "
            "supplier performance monitoring."
        )

    def _build_executive_summary(
        self, m: dict, risk_level: str, risk_factors: List[str]
    ) -> str:
        """Build a concise executive summary from key metrics."""
        product = m["product"]
        demand = m["forecast_demand"]
        inventory = m["current_inventory"]
        priority = m["priority"]

        lines: List[str] = [
            f"ManuSphere AI — Production Status Report for {product}.",
        ]

        if demand > inventory:
            gap = demand - inventory
            lines.append(
                f"Demand ({demand:,} units) exceeds current inventory ({inventory:,} units) "
                f"by {gap:,} units."
            )
        else:
            lines.append(
                f"Current inventory ({inventory:,} units) meets the forecasted demand "
                f"({demand:,} units)."
            )

        if risk_factors:
            lines.append(
                f"Overall risk level is {risk_level}. "
                f"Key concerns: {'; '.join(risk_factors[:3])}."
            )
        else:
            lines.append(f"Overall risk level is {risk_level}. No critical issues detected.")

        lines.append(
            f"Production priority is {priority}. "
            "Immediate action is advised for all HIGH and CRITICAL items."
            if priority in ("HIGH", "CRITICAL")
            else f"Production priority is {priority}. Continue standard operations."
        )

        return " ".join(lines)

    # ------------------------------------------------------------------
    # Gemini AI enhancement
    # ------------------------------------------------------------------

    async def _try_ai_enhancement(
        self, request: RecommendationRequest, metrics: dict
    ) -> Optional[str]:
        """
        Attempt to get an AI-enhanced executive summary from Gemini.

        Returns the AI summary string on success, or None on any failure.
        The caller always falls back to the rule-based summary if None is returned.
        """
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
