import unittest
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.schemas.production_request import ProductionPlanRequest
from app.services.production_service import ProductionPlannerService

class TestProductionPlannerServiceDatabase(unittest.TestCase):
    def setUp(self):
        self.service = ProductionPlannerService()

    def test_production_planning_with_db_inventory_and_supplier(self):
        # Mock database session returning inventory & supplier records
        mock_db = MagicMock()

        # Mock inventory row:
        # product_name="Air Conditioner", current_stock=4000, avg_usage=300, lead_time=10, safety=1000, reorder=5000, eoq=2000, status="LOW"
        inv_row = ("Air Conditioner", 4000, 300.0, 10, 1000, 5000, 2000.0, "LOW")
        # Mock supplier row:
        # supplier_name="Cooling Supply Co", risk_level="LOW", delay=2, quality=95.0, avail=10000.0, risk_score=15.0
        supp_row = ("Cooling Supply Co", "LOW", 2, 95.0, 10000.0, 15.0)

        def mock_execute(query, params=None):
            sql_str = str(query)
            mock_res = MagicMock()
            if "FROM inventory" in sql_str:
                mock_res.fetchone.return_value = inv_row
            elif "FROM suppliers" in sql_str:
                mock_res.fetchone.return_value = supp_row
            else:
                mock_res.fetchone.return_value = None
            return mock_res

        mock_db.execute.side_effect = mock_execute

        req = ProductionPlanRequest(
            product="Air Conditioner",
            forecast_demand=0,
            current_inventory=0,
            daily_capacity=1000,
        )

        plan = self.service.generate_plan(req, db=mock_db)

        # Verified calculations:
        # Estimated Demand = 300 * 10 = 3,000
        # Required Production = max(0, 3000 + 1000 - 4000) = 0
        # Recommended Batch = max(0, 2000) = 2,000
        # Priority = HIGH (because current_stock 4000 <= reorder_point 5000)
        self.assertEqual(plan.product, "Air Conditioner")
        self.assertEqual(plan.current_stock, 4000)
        self.assertEqual(plan.estimated_demand, 3000)
        self.assertEqual(plan.lead_time, 10)
        self.assertEqual(plan.safety_stock, 1000)
        self.assertEqual(plan.reorder_point, 5000)
        self.assertEqual(plan.eoq, 2000.0)
        self.assertEqual(plan.production_quantity, 0)
        self.assertEqual(plan.recommended_batch, 2000)
        self.assertEqual(plan.priority, "HIGH")
        self.assertEqual(plan.supplier_name, "Cooling Supply Co")
        self.assertEqual(plan.quality_score, 95.0)

    def test_product_not_found_returns_404(self):
        mock_db = MagicMock()
        mock_res = MagicMock()
        mock_res.fetchone.return_value = None
        mock_db.execute.return_value = mock_res

        req = ProductionPlanRequest(product="NonExistentItem")
        with self.assertRaises(HTTPException) as ctx:
            self.service.generate_plan(req, db=mock_db)

        self.assertEqual(ctx.exception.status_code, 404)
        self.assertEqual(ctx.exception.detail, "Product not found in inventory.")

    def test_supplier_not_found_continues_with_inventory(self):
        mock_db = MagicMock()
        inv_row = ("Refrigerator", 1000, 100.0, 5, 200, 1500, 800.0, "IN_STOCK")

        def mock_execute(query, params=None):
            sql_str = str(query)
            mock_res = MagicMock()
            if "FROM inventory" in sql_str:
                mock_res.fetchone.return_value = inv_row
            else:
                mock_res.fetchone.return_value = None
            return mock_res

        mock_db.execute.side_effect = mock_execute

        req = ProductionPlanRequest(product="Refrigerator")
        plan = self.service.generate_plan(req, db=mock_db)

        # Estimated demand = 100 * 5 = 500
        # Required production = max(0, 500 + 200 - 1000) = 0
        # Priority = HIGH (1000 <= 1500)
        self.assertEqual(plan.product, "Refrigerator")
        self.assertEqual(plan.supplier_name, "Supplier information unavailable")
        self.assertEqual(plan.priority, "HIGH")

    def test_no_db_returns_503(self):
        req = ProductionPlanRequest(product="Air Conditioner")
        with self.assertRaises(HTTPException) as ctx:
            self.service.generate_plan(req, db=None)

        self.assertEqual(ctx.exception.status_code, 503)
        self.assertEqual(ctx.exception.detail, "Database connection failure.")

if __name__ == "__main__":
    unittest.main()
