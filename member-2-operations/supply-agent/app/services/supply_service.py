from app.schemas import SupplyRequest, SupplyResponse

class SupplyService:
    def analyze_supplier(self, request: SupplyRequest) -> SupplyResponse:
        raw_delay = request.actual_delivery_days - request.expected_delivery_days
        supplier_delay = raw_delay > 0
        delay_days = max(0, raw_delay)
        
        risk = self._calculate_supplier_risk(raw_delay)
        recommended_supplier = "Supplier A"
        
        return SupplyResponse(
            supplier_name=request.supplier_name,
            supplier_delay=supplier_delay,
            delay_days=delay_days,
            risk=risk,
            recommended_supplier=recommended_supplier
        )

    def _calculate_supplier_risk(self, delay_days: int) -> str:
        """
        Calculates the risk level based on delivery delay.
        Rules:
        - delay <= 0: LOW
        - delay between 1 and 3: MEDIUM
        - delay >= 4: HIGH
        """
        if delay_days <= 0:
            return "LOW"
        elif delay_days <= 3:
            return "MEDIUM"
        else:
            return "HIGH"
