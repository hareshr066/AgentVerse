import json
import asyncio
from typing import Dict, Any, List
# pyrefly: ignore [missing-import]
from google import genai
# pyrefly: ignore [missing-import]
from google.genai import types
from app.core.config import settings

def _generate_analysis_sync(news: List[Dict[str, Any]], weather: Dict[str, Any], trends: Dict[str, Any]) -> Dict[str, Any]:
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key in ["your-gemini-api-key-here", "your_gemini_api_key_here"]:
        return {"error": "Gemini API key not configured"}

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

    try:
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
)
        raw_text = response.text.strip() if response.text else ""
        
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        if not raw_text:
            return {"error": "Gemini returned empty response"}

        result = json.loads(raw_text)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Gemini analysis error: {str(e)}"}

async def analyze_event(news: List[Dict[str, Any]], weather: Dict[str, Any], trends: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return await asyncio.to_thread(_generate_analysis_sync, news, weather, trends)
    except Exception as e:
        return {"error": f"Failed to run Gemini analysis: {str(e)}"}
