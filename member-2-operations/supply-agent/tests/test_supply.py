import pytest
from httpx import AsyncClient
from app.services.supply_service import SupplyService

@pytest.mark.anyio
async def test_analyze_supply_endpoint_medium_risk(client: AsyncClient):
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
    assert data["risk"] == "MEDIUM"
    assert data["recommended_supplier"] == "Supplier A"

@pytest.mark.anyio
async def test_analyze_supply_endpoint_low_risk(client: AsyncClient):
    payload = {
        "supplier_name": "Supplier Y",
        "expected_delivery_days": 5,
        "actual_delivery_days": 5,
        "supplier_rating": 4.5
    }
    response = await client.post("/supply/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["supplier_name"] == "Supplier Y"
    assert data["supplier_delay"] is False
    assert data["delay_days"] == 0
    assert data["risk"] == "LOW"

@pytest.mark.anyio
async def test_analyze_supply_endpoint_high_risk(client: AsyncClient):
    payload = {
        "supplier_name": "Supplier Z",
        "expected_delivery_days": 5,
        "actual_delivery_days": 10,
        "supplier_rating": 3.8
    }
    response = await client.post("/supply/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["supplier_name"] == "Supplier Z"
    assert data["supplier_delay"] is True
    assert data["delay_days"] == 5
    assert data["risk"] == "HIGH"

def test_calculate_supplier_risk_unit():
    service = SupplyService()
    assert service._calculate_supplier_risk(0) == "LOW"
    assert service._calculate_supplier_risk(-2) == "LOW"
    assert service._calculate_supplier_risk(1) == "MEDIUM"
    assert service._calculate_supplier_risk(3) == "MEDIUM"
    assert service._calculate_supplier_risk(4) == "HIGH"
    assert service._calculate_supplier_risk(10) == "HIGH"
