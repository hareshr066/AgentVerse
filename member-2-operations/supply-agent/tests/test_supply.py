import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_analyze_supply_endpoint(client: AsyncClient):
    payload = {
        "supplier_name": "Supplier X",
        "expected_delivery_days": 5,
        "actual_delivery_days": 7,
        "supplier_rating": 4.2
    }
    response = await client.post("/supply/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["supplier_name"] == "Supplier X"
    assert data["supplier_delay"] is True
    assert data["delay_days"] == 2
    assert data["risk"] == "LOW"
    assert data["recommended_supplier"] == "Supplier A"

