# Inventory Agent

This microservice is responsible for monitoring inventory levels, managing warehouse items, and reporting thresholds.

## 📂 Directory Layout
- `app/`: Production-ready FastAPI codebase.
  - `api/`: API Routers and API V1 endpoint definitions.
  - `core/`: Configurations (Pydantic settings) and database drivers (SQLAlchemy).
  - `models/`: Database schemas mapping to tables.
  - `schemas/`: Pydantic validation schemas.
  - `services/`: Encapsulated operations and database CRUD queries.
  - `utils/`: Reusable helper routines.
- `tests/`: Endpoint integration tests and unit tests.
- `Dockerfile`: Multi-stage Docker image packaging configuration.
- `requirements.txt`: Python package dependencies.
- `.env.example`: Environmental settings template.

## 🚀 Getting Started
1. Create your local config:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start development server:
   ```bash
   uvicorn app.main:app --reload
   ```
