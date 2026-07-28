import logging
from typing import Dict, Any, Optional
from app.gemini.base_provider import BaseRecommendationProvider
from app.gemini.gemini_provider import GeminiRecommendationProvider
from app.services.prompt_builder import PromptBuilder
from app.services.response_parser import ResponseParser

logger = logging.getLogger("recommendation-agent.service")

class RecommendationService:
    def __init__(self, provider: Optional[BaseRecommendationProvider] = None):
        # Allow injecting any provider class matching the BaseRecommendationProvider interface
        self.provider = provider or GeminiRecommendationProvider()

    async def get_combined_recommendation(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("Generating intelligent factory recommendation from telemetry inputs...")
        
        # 1. Build prompt
        prompt = PromptBuilder.build_recommendation_prompt(telemetry)
        
        # 2. Invoke provider
        raw_result = await self.provider.generate_recommendations(prompt)
        
        # 3. Parse and clean response
        parsed_result = ResponseParser.parse_recommendation_response(raw_result)
        
        logger.info("Intelligent recommendation generated successfully.")
        return parsed_result
