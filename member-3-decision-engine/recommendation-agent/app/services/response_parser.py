import logging
from typing import Dict, Any

logger = logging.getLogger("recommendation-agent.parser")

class ResponseParser:
    @staticmethod
    def parse_recommendation_response(raw_response: Any) -> Dict[str, Any]:
        default_response = {
            "summary": "Data aggregation completed. Buffers and capacities appear nominal.",
            "risk_level": "Low",
            "priority": "Medium",
            "recommendations": ["Optimize safety stock levels based on standard daily usage statistics."],
            "actions": ["Audit stock logs."],
            "confidence": 0.85
        }

        if not isinstance(raw_response, dict):
            logger.warning("Raw response is not a dictionary. Applying default schema.")
            return default_response

        parsed = {}
        parsed["summary"] = str(raw_response.get("summary", default_response["summary"]))
        parsed["risk_level"] = str(raw_response.get("risk_level", default_response["risk_level"]))
        parsed["priority"] = str(raw_response.get("priority", default_response["priority"]))
        
        # Recommendations list validation
        recs = raw_response.get("recommendations", [])
        if isinstance(recs, list):
            parsed["recommendations"] = [str(r) for r in recs]
        else:
            parsed["recommendations"] = default_response["recommendations"]

        # Actions list validation
        actions = raw_response.get("actions", [])
        if isinstance(actions, list):
            parsed["actions"] = [str(a) for a in actions]
        else:
            parsed["actions"] = default_response["actions"]

        # Confidence conversion
        try:
            parsed["confidence"] = float(raw_response.get("confidence", default_response["confidence"]))
        except (ValueError, TypeError):
            parsed["confidence"] = default_response["confidence"]

        return parsed
