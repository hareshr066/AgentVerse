import unittest
import asyncio
from app.schemas.recommendation_request import RecommendationRequest
from app.services.recommendation_service import RecommendationService


class TestRecommendationService(unittest.TestCase):
    def setUp(self):
        self.service = RecommendationService()

    def test_flat_payload_recommendation(self):
        payload = {
            "product": "Air Conditioner",
            "forecast": 12000,
            "inventory": 4000,
            "supplier_delay": True,
            "delay_days": 4,
            "production_quantity": 9000,
        }
        req = RecommendationRequest.model_validate(payload)
        response = asyncio.run(self.service.recommend(req))

        self.assertIn("Demand", response.executive_summary)
        self.assertEqual(response.production, "Increase production by 20%.")
        self.assertEqual(response.inventory, "Increase safety stock.")
        self.assertEqual(response.supplier, "Use alternate supplier.")
        self.assertEqual(response.risk, "High")
        self.assertEqual(response.priority, "High")
        self.assertEqual(response.confidence, "96%")

    def test_nested_payload_recommendation(self):
        payload = {
            "demand": {"product": "Refrigerator", "forecast_demand": 8000},
            "inventory": {"current_inventory": 9000, "safety_stock": 1000},
            "supply": {"supplier_delay": False, "delay_days": 0},
            "production": {"production_quantity": 0, "priority": "NORMAL"},
        }
        req = RecommendationRequest.model_validate(payload)
        response = asyncio.run(self.service.recommend(req))

        self.assertEqual(response.production, "Maintain current production schedule.")
        self.assertEqual(response.inventory, "Maintain current safety stock levels.")
        self.assertEqual(response.supplier, "Maintain current supplier agreement.")
        self.assertEqual(response.risk, "Low")
        self.assertEqual(response.priority, "Normal")


if __name__ == "__main__":
    unittest.main()
