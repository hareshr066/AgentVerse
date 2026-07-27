import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "service": "Inventory Agent",
        "status": "healthy",
        "version": "1.0.0"
    }

@pytest.mark.anyio
async def test_inventory_calculate(client: AsyncClient):
    payload = {
        "product": "Widget A",
        "forecast_demand": 100,
        "current_stock": 50,
        "daily_demand": 5,
        "lead_time": 3
    }
    response = await client.post("/inventory/calculate", json=payload)
    assert response.status_code == 200
    assert response.json() == {
        "product": "Widget A",
        "current_stock": 50,
        "safety_stock": 15,
        "reorder_point": 30,
        "inventory_status": "HEALTHY",
        "economic_order_quantity": 45,
        "message": "Inventory calculation completed successfully."
    }







