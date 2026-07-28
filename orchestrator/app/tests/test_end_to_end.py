import sys
import os
import importlib.util

current_dir = os.path.dirname(os.path.abspath(__file__))
orchestrator_dir = os.path.abspath(os.path.join(current_dir, "../.."))
demand_agent_dir = os.path.abspath(os.path.join(current_dir, "../../../member-1-ai-intelligence/demand-agent"))

if orchestrator_dir not in sys.path:
    sys.path.insert(0, orchestrator_dir)

import asyncio
import json
import logging
from typing import Dict, Any, List

# Import Orchestrator modules
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.orchestration_service import OrchestrationService

# Dynamically import DemandPredictor from demand-agent to avoid module collision on 'app'
predictor_path = os.path.join(demand_agent_dir, "app", "services", "predictor.py")
spec = importlib.util.spec_from_file_location("demand_agent_predictor", predictor_path)
predictor_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(predictor_module)
DemandPredictor = predictor_module.DemandPredictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_end_to_end")

class EndToEndTestSuite:
    def __init__(self):
        self.orchestration_service = OrchestrationService()
        self.predictor = DemandPredictor()
        self.results: List[Dict[str, Any]] = []

    def log_test_result(self, name: str, passed: bool, details: str, payload: Dict[str, Any], response: Dict[str, Any]):
        status_str = "PASSED" if passed else "FAILED"
        logger.info("Test [%s]: %s - %s", name, status_str, details)
        self.results.append({
            "test_name": name,
            "passed": passed,
            "details": details,
            "input_payload": payload,
            "response": response
        })

    async def run_all_tests(self):
        logger.info("==================================================")
        logger.info("Starting 15 Comprehensive End-to-End Test Cases")
        logger.info("==================================================")

        # ---------------------------------------------------------
        # TEST 1: Normal Demand
        # ---------------------------------------------------------
        req1 = PipelineRequest(product_id="PROD-101", city="Delhi", current_stock=150, sales_history=[100.0, 100.0, 100.0, 100.0, 100.0])
        res1 = await self.orchestration_service.coordinate_workflow(req1)
        passed1 = res1.demand_data.get("predicted_demand") is not None and res1.status in ["success", "degraded"]
        self.log_test_result("1. Normal Demand", passed1, f"Predicted demand: {res1.demand_data.get('predicted_demand')}", req1.model_dump(), res1.model_dump())

        # ---------------------------------------------------------
        # TEST 2: Festival Demand Spike
        # ---------------------------------------------------------
        p2_demand, p2_conf, p2_order, p2_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=100, sales_history=[100.0, 100.0],
            events=[{"category": "Festival", "impact_score": 85.0}], weather={}
        )
        passed2 = p2_demand > 100.0 and any("festival" in r.lower() for r in p2_reasons)
        self.log_test_result("2. Festival Demand Spike", passed2, f"Demand spiked to {p2_demand}", {"events": "Festival"}, {"demand": p2_demand, "reasons": p2_reasons})

        # ---------------------------------------------------------
        # TEST 3: Heavy Rain
        # ---------------------------------------------------------
        p3_demand, p3_conf, p3_order, p3_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=100, sales_history=[100.0, 100.0],
            events=[], weather={"condition": "Heavy Rain", "temperature": 22.0}
        )
        passed3 = p3_demand > 100.0 and any("weather" in r.lower() or "rain" in r.lower() for r in p3_reasons)
        self.log_test_result("3. Heavy Rain", passed3, f"Weather adjusted demand to {p3_demand}", {"weather": "Heavy Rain"}, {"demand": p3_demand, "reasons": p3_reasons})

        # ---------------------------------------------------------
        # TEST 4: Heat Wave
        # ---------------------------------------------------------
        p4_demand, p4_conf, p4_order, p4_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=100, sales_history=[100.0, 100.0],
            events=[], weather={"condition": "Clear", "temperature": 42.0}
        )
        passed4 = p4_demand > 100.0 and any("temperature" in r.lower() or "42" in r for r in p4_reasons)
        self.log_test_result("4. Heat Wave", passed4, f"Heat wave adjusted demand to {p4_demand}", {"weather": "42°C"}, {"demand": p4_demand, "reasons": p4_reasons})

        # ---------------------------------------------------------
        # TEST 5: Supply Disruption
        # ---------------------------------------------------------
        p5_demand, p5_conf, p5_order, p5_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=50, sales_history=[100.0, 100.0],
            events=[{"category": "Supply Chain", "impact_score": 90.0}], weather={}
        )
        passed5 = any("supply" in r.lower() or "disruption" in r.lower() for r in p5_reasons)
        self.log_test_result("5. Supply Disruption", passed5, f"Disruption buffer order: {p5_order}", {"events": "Supply Chain"}, {"order": p5_order, "reasons": p5_reasons})

        # ---------------------------------------------------------
        # TEST 6: Low Inventory
        # ---------------------------------------------------------
        p6_demand, p6_conf, p6_order, p6_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=10, sales_history=[100.0, 100.0],
            events=[], weather={}
        )
        passed6 = p6_order > 0 and any("low inventory" in r.lower() for r in p6_reasons)
        self.log_test_result("6. Low Inventory", passed6, f"Low inventory detected, order recommended: {p6_order}", {"inventory": 10}, {"reasons": p6_reasons})

        # ---------------------------------------------------------
        # TEST 7: High Inventory
        # ---------------------------------------------------------
        p7_demand, p7_conf, p7_order, p7_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=500, sales_history=[100.0, 100.0],
            events=[], weather={}
        )
        passed7 = p7_order == 0.0 and any("sufficient" in r.lower() for r in p7_reasons)
        self.log_test_result("7. High Inventory", passed7, f"Sufficient inventory verified, order: {p7_order}", {"inventory": 500}, {"reasons": p7_reasons})

        # ---------------------------------------------------------
        # TEST 8: Empty Sales History
        # ---------------------------------------------------------
        p8_demand, p8_conf, p8_order, p8_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=50, sales_history=[],
            events=[], weather={}
        )
        passed8 = p8_demand == 100.0 and any("baseline" in r.lower() for r in p8_reasons)
        self.log_test_result("8. Empty Sales History", passed8, f"Baseline demand applied: {p8_demand}", {"sales_history": []}, {"demand": p8_demand, "reasons": p8_reasons})

        # ---------------------------------------------------------
        # TEST 9: Missing Event Agent
        # ---------------------------------------------------------
        req9 = PipelineRequest(product_id="PROD-MISSING-EVENT", city="Delhi", current_stock=100)
        res9 = await self.orchestration_service.coordinate_workflow(req9)
        passed9 = res9.status in ["success", "degraded"] and res9.event_data is not None
        self.log_test_result("9. Missing Event Agent", passed9, "Fallback event data applied gracefully", req9.model_dump(), res9.model_dump())

        # ---------------------------------------------------------
        # TEST 10: Missing Weather API
        # ---------------------------------------------------------
        p10_demand, p10_conf, p10_order, p10_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=50, sales_history=[100.0],
            events=[], weather={"error": "Weather API timeout"}
        )
        passed10 = p10_demand > 0 and p10_conf > 0
        self.log_test_result("10. Missing Weather API", passed10, "Handled missing weather API cleanly", {"weather": "error"}, {"demand": p10_demand})

        # ---------------------------------------------------------
        # TEST 11: Missing Gemini Response
        # ---------------------------------------------------------
        p11_demand, p11_conf, p11_order, p11_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=50, sales_history=[100.0],
            events=[{"error": "Gemini timeout"}], weather={}
        )
        passed11 = len(p11_reasons) > 0 and p11_demand > 0
        self.log_test_result("11. Missing Gemini Response", passed11, "Algorithmic reasons retained as fallback", {"events": "Gemini timeout"}, {"reasons": p11_reasons})

        # ---------------------------------------------------------
        # TEST 12: Invalid Product
        # ---------------------------------------------------------
        req12 = PipelineRequest(product_id="INV-PROD-@#$%^&*", city="Delhi", current_stock=50)
        res12 = await self.orchestration_service.coordinate_workflow(req12)
        passed12 = res12.demand_data.get("predicted_demand") is not None
        self.log_test_result("12. Invalid Product", passed12, f"Handled invalid product cleanly, demand: {res12.demand_data.get('predicted_demand')}", req12.model_dump(), res12.model_dump())

        # ---------------------------------------------------------
        # TEST 13: Invalid City
        # ---------------------------------------------------------
        req13 = PipelineRequest(product_id="PROD-101", city="NonExistentCity9999", current_stock=100)
        res13 = await self.orchestration_service.coordinate_workflow(req13)
        passed13 = res13.demand_data.get("predicted_demand") is not None
        self.log_test_result("13. Invalid City", passed13, "Degraded gracefully for invalid city", req13.model_dump(), res13.model_dump())

        # ---------------------------------------------------------
        # TEST 14: High Sales Trend
        # ---------------------------------------------------------
        p14_demand, p14_conf, p14_order, p14_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=100, sales_history=[100.0, 150.0, 200.0, 250.0, 300.0],
            events=[], weather={}
        )
        passed14 = p14_demand > 200.0 and any("positive sales trend" in r.lower() for r in p14_reasons)
        self.log_test_result("14. High Sales Trend", passed14, f"Upward trend demand: {p14_demand}", {"sales_history": [100, 300]}, {"demand": p14_demand, "reasons": p14_reasons})

        # ---------------------------------------------------------
        # TEST 15: Declining Sales Trend
        # ---------------------------------------------------------
        p15_demand, p15_conf, p15_order, p15_reasons = self.predictor.calculate_prediction(
            product_id="PROD-101", inventory=100, sales_history=[300.0, 250.0, 200.0, 150.0, 100.0],
            events=[], weather={}
        )
        passed15 = p15_demand < 200.0 and any("declining sales trend" in r.lower() for r in p15_reasons)
        self.log_test_result("15. Declining Sales Trend", passed15, f"Downward trend demand: {p15_demand}", {"sales_history": [300, 100]}, {"demand": p15_demand, "reasons": p15_reasons})

        passed_count = sum(1 for r in self.results if r["passed"])
        total_count = len(self.results)

        logger.info("==================================================")
        logger.info("Test Execution Summary: %d / %d Tests Passed", passed_count, total_count)
        logger.info("==================================================")

        return {
            "passed_count": passed_count,
            "total_count": total_count,
            "test_results": self.results
        }

if __name__ == "__main__":
    suite = EndToEndTestSuite()
    asyncio.run(suite.run_all_tests())
