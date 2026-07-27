# API Documentation

## Orchestrator Gateway (Port 8000)
- `GET /` - Root status
- `POST /api/v1/pipeline/sync` - Runs complete end-to-end multi-agent synchronization.
- `GET /api/v1/status` - Health status for all connected nodes.

## Recommendation Agent (Port 8006)
- `POST /api/v1/recommendation/generate` - Invokes Gemini API to generate optimizations.
