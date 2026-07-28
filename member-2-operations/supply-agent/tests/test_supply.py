import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_create_supplier_success(client: AsyncClient):
    payload = {
        "supplier_name": "UltraTech Materials",
        "material_name": "Premium Carbon Fiber",
        "available_quantity": 500,
        "lead_time_days": 4,
        "price_per_unit": 45.5,
        "delivery_delay_days": 1,
        "quality_score": 95.0,
        "on_time_delivery_percentage": 98.0
    }
    response = await client.post("/suppliers/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["supplier_name"] == "UltraTech Materials"
    assert data["material_name"] == "Premium Carbon Fiber"
    assert data["available_quantity"] == 500
    assert data["price_per_unit"] == 45.5
    # Risk calculation verification
    # delay_factor = min(1 * 10, 30) = 10
    # lead_time_factor = min(4 * 2, 20) = 8
    # quality_factor = (100 - 95) * 0.3 = 1.5
    # on_time_factor = (100 - 98) * 0.2 = 0.4
    # risk_score = 10 + 8 + 1.5 + 0.4 = 19.9
    assert data["risk_score"] == 19.9
    assert data["risk_level"] == "Low Risk"
    assert data["recommended"] is True

@pytest.mark.anyio
async def test_create_supplier_high_risk(client: AsyncClient):
    payload = {
        "supplier_name": "Shady Supplies",
        "material_name": "Cheap Iron Rods",
        "available_quantity": 1000,
        "lead_time_days": 15,
        "price_per_unit": 5.0,
        "delivery_delay_days": 5,
        "quality_score": 60.0,
        "on_time_delivery_percentage": 70.0
    }
    response = await client.post("/suppliers/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["risk_level"] in ["High Risk", "Critical"]
    assert data["recommended"] is False

@pytest.mark.anyio
async def test_create_supplier_validation_price(client: AsyncClient):
    payload = {
        "supplier_name": "Failed Price Supplier",
        "material_name": "Premium Carbon Fiber",
        "available_quantity": 500,
        "lead_time_days": 4,
        "price_per_unit": -10.0, # invalid price
        "delivery_delay_days": 1,
        "quality_score": 95.0,
        "on_time_delivery_percentage": 98.0
    }
    response = await client.post("/suppliers/", json=payload)
    assert response.status_code == 422

@pytest.mark.anyio
async def test_create_supplier_validation_quality(client: AsyncClient):
    payload = {
        "supplier_name": "Failed Quality Supplier",
        "material_name": "Premium Carbon Fiber",
        "available_quantity": 500,
        "lead_time_days": 4,
        "price_per_unit": 10.0,
        "delivery_delay_days": 1,
        "quality_score": 105.0, # invalid quality
        "on_time_delivery_percentage": 98.0
    }
    response = await client.post("/suppliers/", json=payload)
    assert response.status_code == 422

@pytest.mark.anyio
async def test_get_suppliers_endpoints(client: AsyncClient):
    # Create one supplier to retrieve
    payload = {
        "supplier_name": "Supplier Endpoint Test",
        "material_name": "Test Fiber",
        "available_quantity": 100,
        "lead_time_days": 2,
        "price_per_unit": 12.5,
        "delivery_delay_days": 0,
        "quality_score": 99.0,
        "on_time_delivery_percentage": 99.0
    }
    create_res = await client.post("/suppliers/", json=payload)
    supplier_id = create_res.json()["id"]

    # Test GET all
    get_all_res = await client.get("/suppliers/")
    assert get_all_res.status_code == 200
    assert len(get_all_res.json()) >= 1

    # Test GET by ID
    get_by_id_res = await client.get(f"/suppliers/{supplier_id}")
    assert get_by_id_res.status_code == 200
    assert get_by_id_res.json()["supplier_name"] == "Supplier Endpoint Test"

    # Test GET recommended
    get_rec_res = await client.get("/suppliers/recommended")
    assert get_rec_res.status_code == 200
    assert any(s["id"] == supplier_id for s in get_rec_res.json())

@pytest.mark.anyio
async def test_update_and_delete_supplier(client: AsyncClient):
    # Create supplier
    payload = {
        "supplier_name": "Updatable Supplier",
        "material_name": "Raw Silicon",
        "available_quantity": 150,
        "lead_time_days": 3,
        "price_per_unit": 80.0,
        "delivery_delay_days": 1,
        "quality_score": 85.0,
        "on_time_delivery_percentage": 90.0
    }
    create_res = await client.post("/suppliers/", json=payload)
    supplier_id = create_res.json()["id"]

    # Update quality to 98% and on-time to 98%
    update_payload = {
        "quality_score": 98.0,
        "on_time_delivery_percentage": 98.0
    }
    update_res = await client.put(f"/suppliers/{supplier_id}", json=update_payload)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["quality_score"] == 98.0
    assert data["recommended"] is True # should become recommended now

    # Delete supplier
    delete_res = await client.delete(f"/suppliers/{supplier_id}")
    assert delete_res.status_code == 204

    # Confirm deleted
    get_res = await client.get(f"/suppliers/{supplier_id}")
    assert get_res.status_code == 404
