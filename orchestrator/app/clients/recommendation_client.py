from app.clients.base_client import BaseClient

class RecommendationClient(BaseClient):
    def __init__(self):
        super().__init__(base_url="http://recommendation-agent:8000")

    async def fetch_recommendation(self, analysis_data: dict):
        return await self.post("/api/v1/recommendation/generate", analysis_data)
