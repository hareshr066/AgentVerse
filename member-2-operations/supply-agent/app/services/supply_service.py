from app.schemas import SupplyRequest, SupplyResponse

class SupplyService:
    def analyze_supplier(self, request: SupplyRequest) -> SupplyResponse:
        raw_delay = request.actual_delivery_days - request.expected_delivery_days
        supplier_delay = raw_delay > 0
        delay_days = max(0, raw_delay)
        
        # Placeholders for risk and recommended supplier
        risk = "LOW"
        recommended_supplier = "Supplier A"
        
        return SupplyResponse(
            supplier_name=request.supplier_name,
            supplier_delay=supplier_delay,
            delay_days=delay_days,
            risk=risk,
            recommended_supplier=recommended_supplier
        )
