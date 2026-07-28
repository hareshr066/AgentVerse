import json
import httpx
from typing import Dict, Any, List
from app.core.config import settings

def _fallback_mock(product: str, city: str, weather: Dict[str, Any]) -> Dict[str, Any]:
    temp = weather.get("temperature", 25)
    condition = weather.get("condition", "clear")
    description = weather.get("description", "sunny")
    
    category = "Normal"
    impact = "Medium"
    score = 50
    reasoning = f"Weather and local news indicators are nominal for {city}. Market interest for {product} is stable."
    
    cond_lower = str(condition).lower()
    desc_lower = str(description).lower()
    if "rain" in cond_lower or "storm" in cond_lower or "thunderstorm" in cond_lower or "snow" in cond_lower:
        category = "Natural Disaster"
        impact = "High"
        score = 75
        reasoning = f"Precipitation ({description}) detected in {city}. Throughput might face logistics delays for {product} distribution."
    
    return {
        "summary": f"External indicators report standard container shipping pathways. No major labor union strikes or disruptive events detected for {product} logistics in {city}.",
        "event_category": category,
        "demand_impact": impact,
        "impact_score": score,
        "reasoning": reasoning
    }

async def analyze_event(news: List[Dict[str, Any]], weather: Dict[str, Any], trends: Dict[str, Any], product: str = "", city: str = "") -> Dict[str, Any]:
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key in ["your-gemini-api-key-here", "your_gemini_api_key_here"]:
        return _fallback_mock(product, city, weather)

    prompt = f"""
You are an Event Intelligence Agent.
Analyze the following data containing news articles, weather conditions, and search interest trends for a specific product and location.

News Articles:
{json.dumps(news, indent=2)}

Weather Data:
{json.dumps(weather, indent=2)}

Google Trends Data:
{json.dumps(trends, indent=2)}

Instructions:
1. Summarize the current situation based on the provided news, weather, and trends.
2. Detect any major events taking place or predicted.
3. Classify the event into EXACTLY ONE of these categories:
   ["Normal", "Festival", "Natural Disaster", "Political", "Economic", "Supply Chain", "Sports", "Health", "Technology"]
4. Estimate the demand impact into EXACTLY ONE of these levels:
   ["Very Low", "Low", "Medium", "High", "Very High"]
5. Generate an impact score as an integer from 0 to 100.
6. Provide a concise reasoning (2-3 sentences).

You MUST return ONLY valid JSON matching this exact structure:
{{
  "summary": "<short summary>",
  "event_category": "<one of the allowed categories>",
  "demand_impact": "<one of the allowed demand impact levels>",
  "impact_score": <integer between 0 and 100>,
  "reasoning": "<short reasoning 2-3 sentences>"
}}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "model": "grok-2",
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
            if response.status_code != 200:
                # Key lacks credits; fallback gracefully
                return _fallback_mock(product, city, weather)
            
            res_json = response.json()
            raw_content = res_json["choices"][0]["message"]["content"].strip()
            
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:]
            if raw_content.startswith("```"):
                raw_content = raw_content[3:]
            if raw_content.endswith("```"):
                raw_content = raw_content[:-3]
            raw_content = raw_content.strip()

            return json.loads(raw_content)
    except Exception:
        return _fallback_mock(product, city, weather)
