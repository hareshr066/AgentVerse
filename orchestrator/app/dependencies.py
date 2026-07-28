from typing import AsyncGenerator
import httpx

async def get_http_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        yield client
