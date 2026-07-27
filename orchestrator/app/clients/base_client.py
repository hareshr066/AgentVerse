import httpx

class BaseClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=base_url)

    async def get(self, endpoint: str):
        response = await self.client.get(endpoint)
        return response.json()

    async def post(self, endpoint: str, json_data: dict):
        response = await self.client.post(endpoint, json=json_data)
        return response.json()
