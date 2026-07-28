import os
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger("recommendation_agent.gemini")

class GeminiClient:
    def __init__(self) -> None:
        self.api_key = settings.GEMINI_API_KEY

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key not in ["your-gemini-api-key-here", "your_gemini_api_key_here"])

    async def get_recommendation(self, prompt: str) -> str | None:
        if not self.is_available():
            logger.debug("Gemini/Grok client offline — skipping AI call.")
            return None

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
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error("xAI Grok API returned status code %s", response.status_code)
                    return None
                
                res_json = response.json()
                raw_content = res_json["choices"][0]["message"]["content"].strip()
                return raw_content
        except Exception as exc:
            logger.error("xAI Grok API call failed: %s", exc)
            return None
