def calculate_supplier_metrics(
    delivery_delay_days: int,
    lead_time_days: int,
    quality_score: float,
    on_time_delivery_percentage: float
) -> dict:
    # 1. Calculate Risk Score (0 - 100 scale)
    delay_factor = min(float(delivery_delay_days) * 10.0, 30.0)
    lead_time_factor = min(float(lead_time_days) * 2.0, 20.0)
    quality_factor = (100.0 - quality_score) * 0.3
    on_time_factor = (100.0 - on_time_delivery_percentage) * 0.2
    
    risk_score = min(max(delay_factor + lead_time_factor + quality_factor + on_time_factor, 0.0), 100.0)
    
    # 2. Classify Risk Level
    if risk_score < 25.0:
        risk_level = "Low Risk"
    elif risk_score < 50.0:
        risk_level = "Medium Risk"
    elif risk_score < 75.0:
        risk_level = "High Risk"
    else:
        risk_level = "Critical"
        
    # 3. Determine Recommendation
    recommended = (
        risk_level == "Low Risk" and
        quality_score > 90.0 and
        on_time_delivery_percentage > 95.0 and
        delivery_delay_days <= 2
    )
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "recommended": recommended
    }
