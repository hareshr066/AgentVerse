import unittest
from app.schemas.production_request import ProductionPlanRequest
from app.services.production_service import ProductionPlannerService


class TestProductionPlannerService(unittest.TestCase):
    def setUp(self):
        self.service = ProductionPlannerService()

    def test_production_quantity_calculation(self):
        # Forecast 12,000 - Inventory 4,200 + Safety Stock 1,000 = 8,800
        req = ProductionPlanRequest(
            product="Air Conditioner",
            forecast_demand=12000,
            current_inventory=4200,
            safety_stock=1000,
            supplier_delay=True,
            delay_days=4,
            daily_capacity=900,
            machines=[
                {"name": "Machine A", "capacity": 500},
                {"name": "Machine B", "capacity": 400},
            ],
        )
        plan = self.service.generate_plan(req)
        self.assertEqual(plan.production_quantity, 8800)
        self.assertEqual(plan.production_days, 10)
        self.assertEqual(plan.capacity_utilization, "98%")
        self.assertEqual(plan.priority, "HIGH")
        self.assertEqual(len(plan.machine_schedule), 2)
        self.assertEqual(plan.machine_schedule[0].machine, "Machine A")
        self.assertEqual(plan.machine_schedule[0].allocated, 500)
        self.assertEqual(plan.machine_schedule[1].machine, "Machine B")
        self.assertEqual(plan.machine_schedule[1].allocated, 400)

    def test_critical_priority_on_delay_over_5_days(self):
        req = ProductionPlanRequest(
            product="Refrigerator",
            forecast_demand=5000,
            current_inventory=6000,
            safety_stock=500,
            supplier_delay=True,
            delay_days=6,
            daily_capacity=500,
        )
        plan = self.service.generate_plan(req)
        self.assertEqual(plan.priority, "CRITICAL")

    def test_normal_priority_when_inventory_sufficient(self):
        req = ProductionPlanRequest(
            product="Washing Machine",
            forecast_demand=5000,
            current_inventory=6000,
            safety_stock=500,
            supplier_delay=False,
            delay_days=0,
            daily_capacity=500,
        )
        plan = self.service.generate_plan(req)
        self.assertEqual(plan.priority, "NORMAL")


if __name__ == "__main__":
    unittest.main()
