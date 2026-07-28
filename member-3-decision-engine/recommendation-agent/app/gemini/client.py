"""
Recommendation Agent - Gemini AI Client

Wraps google-generativeai so it can be injected into RecommendationService
as an optional enhancement layer.

Design contract (kept intentionally stable so the service layer never
needs to change when toggling AI on/off):

    client = GeminiClient()
    if client.is_available():
        text = await client.get_recommendation(prompt)

- When GEMINI_API_KEY is absent or blank the client is in "offline" mode:
  is_available() returns False and get_recommendation() returns None.
- The calling service must handle None and fall back to rule-based output.
- Errors from the Gemini API are caught internally; the client returns None
  and logs the error so the service always gets a predictable result.
"""

import os
import logging

logger = logging.getLogger("recommendation_agent.gemini")

try:
    import google.generativeai as genai  # type: ignore
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False
    logger.warning(
        "google-generativeai package not installed. "
        "Gemini AI enhancement will be unavailable."
    )


class GeminiClient:
    """
    Optional AI enhancement client wrapping Google Gemini.

    Instantiate once per application lifecycle (e.g. at app startup)
    and inject into services that may want AI-enhanced output.

    Thread-safety: the underlying genai SDK is not async-native for
    generate_content; calls are made synchronously inside an async
    wrapper using a thread-pool executor pattern to avoid blocking
    the event loop.
    """

    _MODEL_NAME: str = "gemini-1.5-flash"

    def __init__(self) -> None:
        self._model = None
        api_key = os.getenv("GEMINI_API_KEY", "").strip()

        if not _GENAI_AVAILABLE:
            logger.info("Gemini client: google-generativeai not installed — offline mode.")
            return

        if not api_key:
            logger.info("Gemini client: GEMINI_API_KEY not set — offline mode.")
            return

        try:
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(self._MODEL_NAME)
            logger.info(
                "Gemini client initialised with model '%s'.", self._MODEL_NAME
            )
        except Exception as exc:
            logger.error(
                "Failed to initialise Gemini client: %s — falling back to offline mode.",
                exc,
            )
            self._model = None

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def is_available(self) -> bool:
        """Return True when Gemini is configured and ready to serve requests."""
        return self._model is not None

    async def get_recommendation(self, prompt: str) -> str | None:
        """
        Send a prompt to Gemini and return the text response.

        Args:
            prompt: Fully rendered prompt string (built by the service layer).

        Returns:
            Response text string, or None if the client is offline or the
            request fails.  The caller is responsible for handling None.
        """
        if not self.is_available():
            logger.debug("Gemini client offline — skipping AI call.")
            return None

        try:
            import asyncio

            loop = asyncio.get_event_loop()
            # generate_content is synchronous; run in executor to avoid blocking
            response = await loop.run_in_executor(
                None, self._model.generate_content, prompt
            )
            text = response.text.strip()
            logger.info("Gemini response received (%d chars).", len(text))
            return text
        except Exception as exc:
            logger.error("Gemini API call failed: %s", exc)
            return None
