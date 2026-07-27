import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "service": "Supply Chain Agent",
        "status": "healthy"
    }

@pytest.mark.anyio
async def test_root_check(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "service": "Supply Chain Agent",
        "status": "running"
    }
