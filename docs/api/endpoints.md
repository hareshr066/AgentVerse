# API Documentation

## Orchestrator Gateway (Port 8000)
- `GET /` - Root status
- `POST /api/v1/pipeline/sync` (or `POST /pipeline/sync`) - Executes the complete end-to-end multi-agent synchronization pipeline (`User Request` → `Event Agent` → `Demand Agent` → `Operations/Inventory Agent` → `Decision Engine`).
- `GET /api/v1/status` - Health status for all connected agent nodes.

### Orchestrator Pipeline Request Payload (`POST /api/v1/pipeline/sync`)
```json
{
  "product_id": "PROD-101",
  "city": "Delhi",
  "current_stock": 150,
  "daily_demand": 5,
  "lead_time": 3,
  "sales_history": [100.0, 110.0, 105.0, 120.0, 130.0]
}
```

### Orchestrator Pipeline Response Payload
```json
{
  "status": "success",
  "product_id": "PROD-101",
  "city": "Delhi",
  "event_data": {
    "news": [...],
    "weather": {...},
    "trends": {...},
    "analysis": {...}
  },
  "demand_data": {
    "predicted_demand": 186.06,
    "confidence": 0.90,
    "recommended_order": 36.06,
    "reasons": [...]
  },
  "inventory_data": {
    "current_stock": 150,
    "reorder_point": 15,
    "economic_order_quantity": 36,
    "safety_stock": 10,
    "stock_status": "ADEQUATE"
  },
  "decision_recommendation": {
    "decision_status": "REORDER_REQUIRED",
    "summary": "Demand Agent predicts demand of 186.06 units for 'PROD-101' in Delhi. Current stock is 150 units.",
    "drivers": [...],
    "action_items": [
      "Procure 36.06 units of 'PROD-101' to cover predicted demand of 186.06 units."
    ]
  },
  "pipeline_logs": [
    "Pipeline initiated for Product: 'PROD-101', Location: 'Delhi'",
    "[1/4] Event Agent SUCCESS: Fetched news, weather, and Gemini event analysis.",
    "[2/4] Demand Agent SUCCESS: Forecasted demand = 186.06 units.",
    "[3/4] Operations/Inventory Agent SUCCESS: Computed stock safety levels.",
    "[4/4] Decision Engine SUCCESS: Synthesized end-to-end multi-agent recommendation."
  ]
}
```

## Event Agent (Port 8001)
- `GET /event-score` - Fetches event score, news, weather, and Gemini AI analysis for a product and city.

## Demand Agent (Port 8005)
- `POST /predict-demand` (also `POST /api/v1/predict-demand`) - Calculates predicted demand, confidence score, recommended reorder quantity, and AI/algorithmic explanations.

## Operations / Inventory Agent (Port 8003)
- `POST /inventory/calculate` - Computes safety stock, reorder points, EOQ, and inventory status.

## Recommendation Agent (Port 8006)
- `POST /api/v1/recommendation/generate` - Invokes Gemini API to generate optimizations.
