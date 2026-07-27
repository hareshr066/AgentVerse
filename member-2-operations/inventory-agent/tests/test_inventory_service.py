import pytest
from app.services import InventoryService
from app.core.exceptions import InventoryCalculationError
from app.schemas import InventoryRequest

def test_calculate_safety_stock():
    service = InventoryService()
    
    # Normal case
    assert service._calculate_safety_stock(daily_demand=5, lead_time=3) == 15
    assert service._calculate_safety_stock(daily_demand=10, lead_time=7) == 70
    
    # Edge/Invalid cases
    with pytest.raises(InventoryCalculationError):
        service._calculate_safety_stock(daily_demand=0, lead_time=3)
    with pytest.raises(InventoryCalculationError):
        service._calculate_safety_stock(daily_demand=5, lead_time=0)
    with pytest.raises(InventoryCalculationError):
        service._calculate_safety_stock(daily_demand=-1, lead_time=3)
    with pytest.raises(InventoryCalculationError):
        service._calculate_safety_stock(daily_demand=5, lead_time=-1)

def test_calculate_reorder_point():
    service = InventoryService()
    
    # Normal case
    assert service._calculate_reorder_point(daily_demand=5, lead_time=3, safety_stock=15) == 30
    assert service._calculate_reorder_point(daily_demand=10, lead_time=7, safety_stock=20) == 90
    
    # Edge/Invalid cases
    with pytest.raises(InventoryCalculationError):
        service._calculate_reorder_point(daily_demand=0, lead_time=3, safety_stock=15)
    with pytest.raises(InventoryCalculationError):
        service._calculate_reorder_point(daily_demand=5, lead_time=0, safety_stock=15)
    with pytest.raises(InventoryCalculationError):
        service._calculate_reorder_point(daily_demand=5, lead_time=3, safety_stock=-1)

def test_calculate_eoq():
    service = InventoryService()
    
    # Normal case
    # EOQ = sqrt((2 * 100 * 500) / 50) = sqrt(2000) = 44.72 -> 45
    assert service._calculate_eoq(annual_demand=100, ordering_cost=500.0, holding_cost=50.0) == 45
    # EOQ = sqrt((2 * 1000 * 100) / 20) = sqrt(10000) = 100
    assert service._calculate_eoq(annual_demand=1000, ordering_cost=100.0, holding_cost=20.0) == 100
    
    # Edge/Invalid cases
    with pytest.raises(InventoryCalculationError):
        service._calculate_eoq(annual_demand=0, ordering_cost=500.0, holding_cost=50.0)
    with pytest.raises(InventoryCalculationError):
        service._calculate_eoq(annual_demand=100, ordering_cost=0.0, holding_cost=50.0)
    with pytest.raises(InventoryCalculationError):
        service._calculate_eoq(annual_demand=100, ordering_cost=500.0, holding_cost=0.0)
    with pytest.raises(InventoryCalculationError):
        service._calculate_eoq(annual_demand=-100, ordering_cost=500.0, holding_cost=50.0)

def test_calculate_inventory_status():
    service = InventoryService()
    
    # LOW status: current_stock <= reorder_point
    assert service._calculate_inventory_status(current_stock=25, reorder_point=30) == "LOW"
    assert service._calculate_inventory_status(current_stock=30, reorder_point=30) == "LOW"
    
    # MEDIUM status: current_stock <= reorder_point * 1.5
    assert service._calculate_inventory_status(current_stock=35, reorder_point=30) == "MEDIUM"
    assert service._calculate_inventory_status(current_stock=45, reorder_point=30) == "MEDIUM"
    
    # HEALTHY status: current_stock > reorder_point * 1.5
    assert service._calculate_inventory_status(current_stock=46, reorder_point=30) == "HEALTHY"
    assert service._calculate_inventory_status(current_stock=100, reorder_point=30) == "HEALTHY"
    
    # Edge/Invalid cases
    with pytest.raises(InventoryCalculationError):
        service._calculate_inventory_status(current_stock=-5, reorder_point=30)
    with pytest.raises(InventoryCalculationError):
        service._calculate_inventory_status(current_stock=50, reorder_point=-10)

def test_calculate_inventory_end_to_end():
    service = InventoryService()
    request = InventoryRequest(
        product="Widget A",
        forecast_demand=100,
        current_stock=50,
        daily_demand=5,
        lead_time=3,
        ordering_cost=500.0,
        holding_cost=50.0
    )
    
    response = service.calculate_inventory(request)
    assert response.product == "Widget A"
    assert response.current_stock == 50
    assert response.safety_stock == 15
    assert response.reorder_point == 30
    assert response.inventory_status == "HEALTHY"
    assert response.economic_order_quantity == 45
    assert response.message == "Inventory calculation completed successfully."
