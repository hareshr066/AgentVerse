import os
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger("recommendation_agent.gemini")

class GeminiClient:
    def __init__(self) -> None:
        raw_keys = [
            os.environ.get("GROQ_API_KEY"),
            os.environ.get("XAI_API_KEY"),
            os.environ.get("GROK_API_KEY"),
            os.environ.get("GEMINI_API_KEY"),
            os.environ.get("GOOGLE_API_KEY"),
            settings.GROQ_API_KEY,
            settings.GROK_API_KEY,
            settings.GEMINI_API_KEY,
        ]
        valid_key = None
        invalid_markers = ["PASTE_YOUR", "your-gemini", "your_gemini", "your_grok", "your_groq"]
        for k in raw_keys:
            if k and isinstance(k, str) and len(k.strip()) > 10:
                k_clean = k.strip()
                if not any(marker in k_clean for marker in invalid_markers):
                    valid_key = k_clean
                    break
        self.api_key = valid_key

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def get_recommendation(self, prompt: str) -> str | None:
        if not self.is_available():
            logger.debug("AI client offline — skipping API call.")
            return None

        key = self.api_key.strip()

        # 1. Groq API Endpoint (if key starts with gsk_ or is configured as Groq key)
        if key.startswith("gsk_") or "groq" in key.lower() or os.environ.get("GROQ_API_KEY"):
            logger.info("Connecting to Groq API endpoint...")
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            # Try fast Groq models
            groq_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"]
            for model_name in groq_models:
                payload = {
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "model": model_name,
                    "temperature": 0.2,
                }
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        response = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                        if response.status_code == 200:
                            res_json = response.json()
                            content = res_json["choices"][0]["message"]["content"].strip()
                            logger.info("Groq AI response received successfully using model %s.", model_name)
                            return content
                        else:
                            logger.warning("Groq API returned status code %s for model %s: %s", response.status_code, model_name, response.text[:200])
                except Exception as exc:
                    logger.error("Groq API call failed for model %s: %s", model_name, exc)

        # 2. xAI Grok API Endpoint (if key starts with xai-)
        if key.startswith("xai-") or "grok" in key.lower() or os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY"):
            logger.info("Connecting to xAI Grok API endpoint...")
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            for model_name in ["grok-2", "grok-beta"]:
                payload = {
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "model": model_name,
                    "temperature": 0.2,
                }
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        response = await client.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
                        if response.status_code == 200:
                            res_json = response.json()
                            content = res_json["choices"][0]["message"]["content"].strip()
                            logger.info("xAI Grok response received successfully.")
                            return content
                        else:
                            logger.warning("xAI Grok API returned status code %s for model %s", response.status_code, model_name)
                except Exception as exc:
                    logger.error("xAI Grok API call failed for model %s: %s", model_name, exc)

        # 3. Official Google Gemini API Endpoint (if key starts with AIza)
        if key.startswith("AIza") or "gemini" in key.lower():
            logger.info("Connecting to Google Gemini API endpoint...")
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
                                logger.info("Google Gemini response received successfully.")
                                return parts[0].get("text", "").strip()
                    logger.warning("Google Gemini API returned status code %s", response.status_code)
            except Exception as exc:
                logger.error("Google Gemini API call failed: %s", exc)

        return None
