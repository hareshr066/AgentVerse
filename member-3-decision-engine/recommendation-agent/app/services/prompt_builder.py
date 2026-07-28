import json
from typing import Dict, Any

class PromptBuilder:
    @staticmethod
    def build_recommendation_prompt(telemetry: Dict[str, Any]) -> str:
        inventory_data = telemetry.get("inventory", [])
        supplier_data = telemetry.get("suppliers", [])
        demand_data = telemetry.get("demand_forecasts", [])
        production_data = telemetry.get("production_plans", [])
        event_data = telemetry.get("event_context", {})

        prompt = f"""
You are the principal AI Recommendation Engine for ManuSphere AI, a multi-agent manufacturing platform.
Analyze the following combined factory telemetry and generate intelligent, actionable recommendations.

--- FACTORY TELEMETRY INPUTS ---

1. Inventory Metrics:
{json.dumps(inventory_data, indent=2)}

2. Supplier & Procurement Metrics:
{json.dumps(supplier_data, indent=2)}

3. Demand Forecast Data:
{json.dumps(demand_data, indent=2)}

4. Production Capacity & Plan Status:
{json.dumps(production_data, indent=2)}

5. External Events & Weather/Trends Context:
{json.dumps(event_data, indent=2)}

--- INSTRUCTIONS ---
Analyze the inputs for bottlenecks, stock levels, risk factors, delayed lead times, and capacity.
Generate optimization plans targeting:
- Inventory buffers
- Procurement triggers
- Production scheduling
- Supply chain logistics
- Risk mitigation
- Cost reduction

You MUST return ONLY a valid JSON object matching the exact schema below. Do not include any commentary, explanations, or formatting other than the JSON object itself.

JSON Output Schema:
{{
  "summary": "<Concise paragraph summarizing the state, bottlenecks, and core actions>",
  "risk_level": "<Low | Medium | High | Critical>",
  "priority": "<Low | Medium | High | Critical>",
  "recommendations": [
    "<Recommendation 1>",
    "<Recommendation 2>"
  ],
  "actions": [
    "<Immediate action step 1>",
    "<Immediate action step 2>"
  ],
  "confidence": <Float between 0.0 and 1.0 indicating confidence score>
}}
"""
        return prompt
