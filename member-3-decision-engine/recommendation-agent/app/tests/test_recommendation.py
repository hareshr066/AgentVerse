import unittest
import asyncio
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.schemas.recommendation_request import RecommendationRequest
from app.services.recommendation_service import RecommendationService

class TestRecommendationServiceDatabase(unittest.TestCase):
    def setUp(self):
        self.service = RecommendationService()

    def test_recommendation_with_db_inventory_and_supplier(self):
        mock_db = MagicMock()

        # Inventory row: product_name="Air Conditioner", current_stock=4000, avg_usage=300, lead_time=10, safety=1000, reorder=5000, eoq=2000, status="LOW"
        inv_row = ("Air Conditioner", 4000, 300.0, 10, 1000, 5000, 2000.0, "LOW")
        # Supplier row: supplier_name="AC Parts Inc", material="Air Conditioner", avail=2000.0, lead_days=10, delay=6, quality=92.0, risk_score=80.0, risk_level="HIGH", recommended=True
        supp_row = ("AC Parts Inc", "Air Conditioner", 2000.0, 10, 6, 92.0, 80.0, "HIGH", True)

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

        req = RecommendationRequest(
            question="Should I change supplier?",
            demand={"product": "Air Conditioner", "forecast_demand": 3000},
            inventory={"current_inventory": 4000, "safety_stock": 1000},
            production={"production_quantity": 0}
        )

        res = asyncio.run(self.service.recommend(req, db=mock_db))

        # Verified rules:
        # 1. Supplier delay = 6 > 5 AND risk_level = HIGH -> Recommend changing supplier
        self.assertIn("Recommend changing supplier", res.supplier)
        # 2. Status = LOW -> Recommend urgent replenishment
        self.assertIn("urgent inventory replenishment", res.production)
        self.assertEqual(res.risk, "Critical")
        self.assertEqual(res.priority, "Critical")
        self.assertIn("Air Conditioner", res.current_situation)

    def test_supplier_quality_score_over_90_preferred(self):
        mock_db = MagicMock()
        inv_row = ("Refrigerator", 8000, 100.0, 5, 500, 2000, 1000.0, "IN_STOCK")
        supp_row = ("Quality Metals", "Refrigerator", 10000.0, 5, 0, 95.0, 10.0, "LOW", True)

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

        req = RecommendationRequest(
            question="Is inventory sufficient?",
            demand={"product": "Refrigerator", "forecast_demand": 500},
            inventory={"current_inventory": 8000, "safety_stock": 500},
            production={"production_quantity": 0}
        )

        res = asyncio.run(self.service.recommend(req, db=mock_db))

        self.assertIn("preferred supplier", res.supplier)
        self.assertEqual(res.risk, "Low")
        self.assertEqual(res.priority, "Normal")

    def test_no_db_returns_503(self):
        req = RecommendationRequest(
            question="Should I reorder?",
            demand={"product": "Air Conditioner", "forecast_demand": 1000},
            inventory={"current_inventory": 500},
            production={"production_quantity": 500}
        )
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(self.service.recommend(req, db=None))

        self.assertEqual(ctx.exception.status_code, 503)
        self.assertEqual(ctx.exception.detail, "Database connection failure.")

if __name__ == "__main__":
    unittest.main()
