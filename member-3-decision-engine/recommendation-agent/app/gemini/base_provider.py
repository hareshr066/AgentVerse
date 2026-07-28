from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseRecommendationProvider(ABC):
    @abstractmethod
    async def generate_recommendations(self, prompt: str) -> Dict[str, Any]:
        pass
