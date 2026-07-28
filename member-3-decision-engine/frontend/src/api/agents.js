/**
 * API client for all 6 ManuSphere AI agents and Orchestrator.
 * All paths are proxied through Vite in local development.
 */

const EVENT_BASE = import.meta.env.VITE_EVENT_URL || '/api/event';
const DEMAND_BASE = import.meta.env.VITE_DEMAND_URL || '/api/demand';
const INVENTORY_BASE = import.meta.env.VITE_INVENTORY_URL || '/api/inventory';
const SUPPLY_BASE = import.meta.env.VITE_SUPPLY_URL || '/api/supply';
const PRODUCTION_BASE = import.meta.env.VITE_PRODUCTION_URL || '/api/production';
const RECOMMENDATION_BASE = import.meta.env.VITE_RECOMMENDATION_URL || '/api/recommendation';
const ORCHESTRATOR_BASE = import.meta.env.VITE_ORCHESTRATOR_URL || '/api/orchestrator';

async function post(base, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function get(base, path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${base}${path}${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ──────────────────────────────────────────────
   1. Event Parsing Agent (8001)
   ────────────────────────────────────────────── */
export async function getEventScore(product, city) {
  return get(EVENT_BASE, '/event-score', { product, city });
}
export async function checkEventHealth() {
  return get(EVENT_BASE, '/health');
}

/* ──────────────────────────────────────────────
   2. Demand Forecast Agent (8002)
   ────────────────────────────────────────────── */
export async function predictDemand(payload) {
  return post(DEMAND_BASE, '/predict-demand', payload);
}
export async function checkDemandHealth() {
  return get(DEMAND_BASE, '/health');
}

/* ──────────────────────────────────────────────
   3. Inventory Agent (8003)
   ────────────────────────────────────────────── */
export async function calculateInventory(payload) {
  return post(INVENTORY_BASE, '/inventory/calculate', payload);
}
export async function checkInventoryHealth() {
  return get(INVENTORY_BASE, '/health');
}

/* ──────────────────────────────────────────────
   4. Supply Chain Agent (8004)
   ────────────────────────────────────────────── */
export async function analyzeSupply(payload) {
  return post(SUPPLY_BASE, '/supply/analyze', payload);
}
export async function checkSupplyHealth() {
  return get(SUPPLY_BASE, '/health');
}

/* ──────────────────────────────────────────────
   5. Production Planning Agent (8005)
   ────────────────────────────────────────────── */
export async function generateProductionPlan(payload) {
  return post(PRODUCTION_BASE, '/api/v1/production-plan', payload);
}
export async function checkProductionHealth() {
  return get(PRODUCTION_BASE, '/health');
}

/* ──────────────────────────────────────────────
   6. Gemini Recommendation Agent (8006)
   ────────────────────────────────────────────── */
export async function generateRecommendation(payload) {
  return post(RECOMMENDATION_BASE, '/api/v1/recommend', payload);
}
export async function checkRecommendationHealth() {
  return get(RECOMMENDATION_BASE, '/health');
}

/* ──────────────────────────────────────────────
   Orchestrator Gateway (8000) & Database Routes
   ────────────────────────────────────────────── */
export async function triggerSyncPipeline(payload) {
  return post(ORCHESTRATOR_BASE, '/pipeline/sync', payload);
}
export async function checkOrchestratorHealth() {
  return get(ORCHESTRATOR_BASE, '/status');
}
export async function getEventsHistory() {
  return get(ORCHESTRATOR_BASE, '/events/history');
}
export async function getDemandHistory() {
  return get(ORCHESTRATOR_BASE, '/demand/history');
}
export async function getPipelineHistory() {
  return get(ORCHESTRATOR_BASE, '/pipeline/history');
}
