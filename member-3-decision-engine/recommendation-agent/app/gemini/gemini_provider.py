import json
import logging
import httpx
from typing import Dict, Any
from app.gemini.base_provider import BaseRecommendationProvider
from app.core.config import settings

logger = logging.getLogger("recommendation-agent.grok")

class GeminiRecommendationProvider(BaseRecommendationProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    async def generate_recommendations(self, prompt: str) -> Dict[str, Any]:
        if not self.api_key or self.api_key in ["your-gemini-api-key-here", "your_gemini_api_key_here"]:
            logger.warning("Grok API key not configured. Returning premium fallback mock JSON.")
            return self._fallback_mock()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
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
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error("xAI Grok API returned status code %s. Using fallback mock.", response.status_code)
                    return self._fallback_mock()
                
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
        except Exception as e:
            logger.error("xAI Grok invocation failed: %s. Returning fallback mock.", str(e))
            return self._fallback_mock()

    def _fallback_mock(self) -> Dict[str, Any]:
        return {
            "summary": "Telemetry indicates micro-controllers buffer runway is at 2 days. Overall equipment effectiveness (OEE) is at 88.4% and packaging throughput is facing a minor bottleneck. Mitigation actions required.",
            "risk_level": "Medium",
            "priority": "High",
            "recommendations": [
                "Procure 500 units of primary micro-controllers immediately to prevent assembly stall.",
                "Initiate alternative shipping channels via pre-approved local suppliers to bypass container logistics delay.",
                "Redistribute primary packaging conveyor load from Line 3 to Line 4 to bypass throughput bottleneck."
            ],
            "actions": [
                "Trigger procurement purchase order for Silicon Sensors.",
                "Update Production line schedule to balance capacity."
            ],
            "confidence": 0.90
        }
