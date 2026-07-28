from typing import List, Dict, Any, Tuple, Optional
from app.core.logger import logger

class DemandPredictor:
    def calculate_prediction(
        self,
        product_id: str,
        inventory: float,
        sales_history: List[float],
        events: List[Dict[str, Any]],
        weather: Dict[str, Any],
        trends: Optional[Dict[str, Any]] = None
    ) -> Tuple[float, float, float, List[str]]:
        reasons: List[str] = []

        # 1. Base Forecast & Sales Trend Calculation
        if sales_history and len(sales_history) > 0:
            weights = [i + 1 for i in range(len(sales_history))]
            total_weight = sum(weights)
            weighted_avg = sum(s * w for s, w in zip(sales_history, weights)) / total_weight
            
            latest_sales = float(sales_history[-1])
            if len(sales_history) >= 2:
                recent_trend = (latest_sales - float(sales_history[0])) / max(1.0, float(sales_history[0]))
            else:
                recent_trend = 0.0

            base_forecast = weighted_avg * (1.0 + min(0.3, max(-0.3, recent_trend * 0.5)))
            
            if recent_trend > 0.05:
                reasons.append(f"Positive sales trend observed with recent sales reaching {latest_sales} units.")
            elif recent_trend < -0.05:
                reasons.append(f"Declining sales trend detected (latest: {latest_sales} units).")
            else:
                reasons.append(f"Stable sales history with weighted average of {round(weighted_avg, 2)} units.")
        else:
            base_forecast = 100.0
            reasons.append("Baseline sales estimate applied (100 units).")

        # 2. Event Impact Calculation
        event_multiplier = 1.0
        max_event_score = 0.0
        detected_categories: List[str] = []
        is_festival = False
        is_supply_disruption = False

        for evt in events:
            if isinstance(evt, dict):
                cat = str(evt.get("category", evt.get("event_category", "Normal"))).strip()
                score = float(evt.get("impact_score", 50.0))
                if score > max_event_score:
                    max_event_score = score
                
                if cat and cat != "Normal" and cat not in detected_categories:
                    detected_categories.append(cat)
                
                if cat.lower() == "festival":
                    is_festival = True
                elif cat.lower() in ["supply chain", "natural disaster"]:
                    is_supply_disruption = True

        if is_festival:
            event_multiplier += 0.25
            reasons.append("Upcoming festival detected; increased demand expected.")
        elif max_event_score > 0:
            event_multiplier += (max_event_score / 250.0)

        if detected_categories and not is_festival:
            reasons.append(f"Event signals detected: {', '.join(detected_categories)} (impact score: {max_event_score}).")

        if is_supply_disruption:
            reasons.append("Potential supply chain/disruption signal detected; safety reorder recommended.")

        # 3. Weather Impact Calculation
        weather_multiplier = 1.0
        if isinstance(weather, dict) and weather and "error" not in weather:
            cond = str(weather.get("condition", weather.get("weather_condition", ""))).lower()
            temp = weather.get("temperature")

            if any(term in cond for term in ["rain", "storm", "snow", "thunderstorm", "drizzle"]):
                weather_multiplier *= 1.10
                reasons.append(f"Adverse weather conditions ('{cond}') anticipated to influence demand.")
            elif temp is not None and float(temp) > 32.0:
                weather_multiplier *= 1.05
                reasons.append(f"Elevated temperature ({temp}°C) factored into seasonal demand adjustment.")

        # 4. Google Trends Impact Calculation
        trends_multiplier = 1.0
        if isinstance(trends, dict) and trends and "error" not in trends:
            direction = str(trends.get("trend_direction", "")).strip().capitalize()
            latest_interest = float(trends.get("latest_interest", 0.0))
            avg_interest = float(trends.get("average_interest", 0.0))

            if direction == "Rising":
                trends_multiplier *= 1.15
                reasons.append(f"Rising search trend detected (+{round(latest_interest - avg_interest, 1)} interest points above average).")
            elif direction == "Falling":
                trends_multiplier *= 0.90
                reasons.append("Falling search interest trend detected.")

        # 5. Compute Final Predicted Demand
        predicted_demand = round(max(0.0, base_forecast * event_multiplier * weather_multiplier * trends_multiplier), 2)

        # 6. Confidence Score Calculation
        base_confidence = 0.70
        if sales_history:
            base_confidence += min(0.12, len(sales_history) * 0.02)
        if events:
            base_confidence += 0.05
        if weather and "error" not in weather:
            base_confidence += 0.05
        if trends and "error" not in trends:
            base_confidence += 0.04
        confidence = round(min(0.96, base_confidence), 2)

        # 7. Recommended Order & Inventory Assessment
        safety_buffer = 1.15 if is_supply_disruption else 1.0
        target_need = predicted_demand * safety_buffer
        recommended_order = round(max(0.0, target_need - max(0.0, inventory)), 2)

        if inventory < predicted_demand * 0.3 and predicted_demand > 0:
            reasons.append(f"Low inventory warning ({inventory} units in stock vs {predicted_demand} predicted demand).")

        if inventory < target_need:
            reasons.append(f"Recommended order of {recommended_order} units calculated (target need: {round(target_need, 2)}, stock: {inventory}).")
        else:
            reasons.append(f"Current inventory ({inventory} units) is sufficient to cover predicted demand ({predicted_demand} units).")

        logger.info("Demand prediction completed for %s: demand=%s, confidence=%s, order=%s", 
                    product_id, predicted_demand, confidence, recommended_order)

        return predicted_demand, confidence, recommended_order, reasons
