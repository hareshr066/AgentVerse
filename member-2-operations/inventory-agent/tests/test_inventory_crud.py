import pytest
import uuid
from httpx import AsyncClient

@pytest.mark.anyio
async def test_inventory_crud_lifecycle(client: AsyncClient):
    unique_suffix = uuid.uuid4().hex[:8]
    product_name = f"Test Product X {unique_suffix}"
    
    # 1. Create inventory entry
    payload = {
        "product_name": product_name,
        "current_stock": 150,
        "average_daily_usage": 10.0,
        "lead_time": 5
    }
    response = await client.post("/inventory/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["product_name"] == product_name
    assert data["current_stock"] == 150
    assert data["safety_stock"] == 50.0 # 10.0 * 5
    assert data["reorder_point"] == 100.0 # (10.0 * 5) + 50.0
    assert data["eoq"] > 0
    assert data["status"] == "Healthy"
    inventory_id = data["id"]

    # 2. Duplicate detection
    response = await client.post("/inventory/", json=payload)
    assert response.status_code == 400

    # 3. Read by ID
    response = await client.get(f"/inventory/{inventory_id}")
    assert response.status_code == 200
    assert response.json()["product_name"] == product_name

    # 4. Update
    update_payload = {
        "current_stock": 20 # Drop stock to trigger Low/Critical stock status
    }
    response = await client.put(f"/inventory/{inventory_id}", json=update_payload)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["current_stock"] == 20
    assert updated_data["status"] == "Critical" # 20 <= 100 * 0.5 (50) -> Critical

    # 5. List all
    response = await client.get("/inventory/")
    assert response.status_code == 200
    assert len(response.json()) > 0

    # 6. Delete
    response = await client.delete(f"/inventory/{inventory_id}")
    assert response.status_code == 204

    # 7. Get deleted item (404)
    response = await client.get(f"/inventory/{inventory_id}")
    assert response.status_code == 404

@pytest.mark.anyio
async def test_inventory_validation(client: AsyncClient):
    # Negative stock validation
    payload = {
        "product_name": f"Invalid Product {uuid.uuid4().hex[:8]}",
        "current_stock": -5,
        "average_daily_usage": 10.0,
        "lead_time": 5
    }
    response = await client.post("/inventory/", json=payload)
    assert response.status_code == 422

    # Negative lead time validation
    payload = {
        "product_name": f"Invalid Product {uuid.uuid4().hex[:8]}",
        "current_stock": 100,
        "average_daily_usage": 10.0,
        "lead_time": -1
    }
    response = await client.post("/inventory/", json=payload)
    assert response.status_code == 422

    # Empty product name validation
    payload = {
        "product_name": "   ",
        "current_stock": 100,
        "average_daily_usage": 10.0,
        "lead_time": 5
    }
    response = await client.post("/inventory/", json=payload)
    assert response.status_code == 422
