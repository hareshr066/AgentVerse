import os
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger("recommendation_agent.gemini")

class GeminiClient:
    def __init__(self) -> None:
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")

    def is_available(self) -> bool:
        key = (self.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or "").strip()
        return bool(key and key not in ["PASTE_YOUR_GEMINI_API_KEY_HERE", "your-gemini-api-key-here", "your_gemini_api_key_here"])

    async def get_recommendation(self, prompt: str) -> str | None:
        if not self.is_available():
            logger.debug("Gemini AI client offline — skipping API call.")
            return None

        key = (self.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or "").strip()

        # 1. Official Google Gemini API Endpoint
        if key.startswith("AIza") or "gemini" in key.lower() or len(key) >= 30:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            payload = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            }
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        res_json = response.json()
                        candidates = res_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
                    logger.warning("Google Gemini API returned status code %s", response.status_code)
            except Exception as exc:
                logger.error("Google Gemini API call failed: %s", exc)

        # 2. xAI Grok / OpenAI API Fallback
        headers = {
            "Authorization": f"Bearer {key}",
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
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
                if response.status_code == 200:
                    res_json = response.json()
                    return res_json["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            logger.error("AI API call failed: %s", exc)

        return None
