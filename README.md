# ManuSphere AI – Multi-Agent Manufacturing Intelligence Platform

## Project Overview
ManuSphere AI is a state-of-the-art, scalable, multi-agent manufacturing intelligence platform designed for hackathons and production scaling. It aggregates telemetry events, computes demand forecasts, cross-references inventory and supply chain logs, structures production schedules, and yields AI-powered optimizations via Google's Gemini API.

---

## 📂 Project Architecture Structure

- **`member-1-ai-intelligence/`**: Managed by Member 1. Hosts the Event Parsing Agent and Demand Forecast Agent.
- **`member-2-operations/`**: Managed by Member 2. Hosts the Inventory Agent and Supply Procurement Agent.
- **`member-3-decision-engine/`**: Managed by Member 3. Hosts the Production Scheduler Agent, Gemini Recommendation Agent, and the React + Vite Frontend.
- **`orchestrator/`**: The system API Gateway. Controls communication and triggers pipelines across agents.
- **`shared/`**: Common artifacts: database schemas, API contracts, JSON telemetry samples, global configurations.
- **`docs/`**: Project documentation, architectural patterns, API specs, and team meeting summaries.

---

## 🚀 Running the Project

### Prerequisites
- Docker & Docker Compose
- Node.js & Python 3.11 (if developing locally)

### Setup & Startup
1. Set up your environment variable file by adding your Gemini API key in your main configuration or `.env`:
   ```bash
   export GEMINI_API_KEY="your_actual_key_here"
   ```
2. Build and run all microservices via Docker Compose:
   ```bash
   docker compose up --build
   ```
3. Open `http://localhost:3000` to inspect the premium analytics dashboard!

---

## 🤝 Collaboration Workflow for the Hackathon
1. **Branching Strategy**: Each member should create branches matching their role prefix:
   - `member-1/feature-name`
   - `member-2/feature-name`
   - `member-3/feature-name`
2. **Pull Requests**: Pull requests should merge into `main` after standard linting passes and a brief peer review.
3. **Configuration**: Keep `.env` files locally. Use `.env.example` templates committed in the respective folders for config structure updates.
