// Rich, agent-specific content that powers each agent's *unique* page layout.
// Keyed by agent id. Kept separate from agents.jsx so the registry stays lean.

export const eventDetail = {
  log: [
    { t: '20:41:07', level: 'info', msg: 'Normalized 2,304 telemetry frames from Line 2' },
    { t: '20:40:55', level: 'warn', msg: 'Vibration spike on Press #7 (2.1× baseline)' },
    { t: '20:40:31', level: 'info', msg: 'Sensor firmware v3.1 schema auto-mapped' },
    { t: '20:40:02', level: 'error', msg: 'Payload dropped: malformed CRC on node CX-14' },
    { t: '20:39:44', level: 'info', msg: 'Batch flushed to demand pipeline (1.2 MB)' },
    { t: '20:39:12', level: 'warn', msg: 'Back-pressure: buffer at 74% on ingest-3' },
    { t: '20:38:50', level: 'info', msg: 'Heartbeat OK — 6 producers connected' },
    { t: '20:38:29', level: 'info', msg: 'Enriched 1,880 events with asset metadata' },
    { t: '20:38:04', level: 'info', msg: 'Schema registry sync complete (v3.1)' },
    { t: '20:37:41', level: 'warn', msg: 'Thermal drift on kiln sensor T-22 (+3.4°C)' },
    { t: '20:37:19', level: 'info', msg: 'Windowed aggregation flushed for Line 4' },
    { t: '20:36:58', level: 'error', msg: 'Node CX-9 timeout — retry scheduled' },
    { t: '20:36:33', level: 'info', msg: 'Deduplicated 412 duplicate frames' },
    { t: '20:36:10', level: 'info', msg: 'Ingest-2 offset committed at 9,441,203' },
  ],
  anomalies: [
    { name: 'Vibration', count: 8, tone: '#f43f5e' },
    { name: 'Thermal', count: 5, tone: '#f59e0b' },
    { name: 'Voltage', count: 3, tone: '#3b82f6' },
    { name: 'CRC / Drop', count: 1, tone: '#8b5cf6' },
  ],
  sources: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Packaging', 'QA Cell'],
};

export const demandDetail = {
  skus: [
    { sku: 'AUT-Fastener-M8', next: 210, change: 25, conf: 94 },
    { sku: 'SEN-Silicon-v2', next: 148, change: 12, conf: 91 },
    { sku: 'PKG-Film-Roll', next: 96, change: -6, conf: 88 },
    { sku: 'MCU-Cortex-A7', next: 64, change: 40, conf: 82 },
    { sku: 'STL-Coil-Raw', next: 320, change: 8, conf: 96 },
  ],
  scenarios: [
    { name: 'Baseline', uplift: '0%', note: 'Current order book, no shocks.', tone: '#14b8a6' },
    { name: 'Seasonal Peak', uplift: '+25%', note: 'Automotive Q4 surge applied.', tone: '#f59e0b' },
    { name: 'Supply Shock', uplift: '-15%', note: 'APAC container delay 2 wks.', tone: '#f43f5e' },
  ],
};

export const inventoryDetail = {
  stock: [
    { name: 'Silicon Sensors', onHand: 45, threshold: 100, unit: 'units' },
    { name: 'Raw Steel Coils', onHand: 320, threshold: 150, unit: 'coils' },
    { name: 'Micro-controllers', onHand: 88, threshold: 120, unit: 'units' },
    { name: 'Packaging Film', onHand: 1200, threshold: 400, unit: 'm' },
    { name: 'Fasteners M8', onHand: 640, threshold: 300, unit: 'units' },
  ],
  warehouses: [
    { code: 'WH-1', name: 'Central', fill: 82 },
    { code: 'WH-2', name: 'North Dock', fill: 61 },
    { code: 'WH-3', name: 'Overflow', fill: 34 },
  ],
};

export const supplyDetail = {
  suppliers: [
    { rank: 1, name: 'Ironworks Local', score: 96, lead: 6, reliability: 99 },
    { rank: 2, name: 'Shenzhen Micro', score: 88, lead: 18, reliability: 94 },
    { rank: 3, name: 'Nordic Steel Co', score: 81, lead: 11, reliability: 90 },
    { rank: 4, name: 'PacRim Freight', score: 72, lead: 21, reliability: 85 },
  ],
  orders: [
    { id: 'PO-4821', item: 'Silicon Sensors ×500', status: 'In Transit', eta: '2 days', tone: '#3b82f6' },
    { id: 'PO-4818', item: 'Raw Steel Coils ×40', status: 'Confirmed', eta: '5 days', tone: '#14b8a6' },
    { id: 'PO-4815', item: 'Micro-controllers ×300', status: 'Delayed', eta: '18 days', tone: '#f43f5e' },
    { id: 'PO-4809', item: 'Packaging Film ×2000m', status: 'Delivered', eta: 'done', tone: '#10b981' },
  ],
};

export const productionDetail = {
  lines: [
    { name: 'Line 1', util: 82, status: 'Running' },
    { name: 'Line 2', util: 90, status: 'Running' },
    { name: 'Line 3', util: 92, status: 'Bottleneck' },
    { name: 'Line 4', util: 68, status: 'Running' },
    { name: 'Line 5', util: 0, status: 'Maintenance' },
  ],
  jobs: [
    { job: 'JOB-7781 · Fastener batch', line: 'Line 2', progress: 76, eta: '48m' },
    { job: 'JOB-7783 · Sensor assembly', line: 'Line 1', progress: 40, eta: '1h 25m' },
    { job: 'JOB-7788 · Packaging run', line: 'Line 3', progress: 88, eta: '18m' },
    { job: 'JOB-7790 · QA + palletize', line: 'Line 4', progress: 12, eta: '2h 40m' },
  ],
  oee: [
    { label: 'Availability', value: 94 },
    { label: 'Performance', value: 91 },
    { label: 'Quality', value: 98 },
  ],
};

export const recommendationDetail = {
  presets: [
    'Analyze inventory and recommend optimization actions for peak-hour bottlenecks.',
    'How should we re-sequence jobs if Line 3 goes down for maintenance?',
    'Suggest procurement actions given the 25% automotive demand uplift.',
  ],
  feed: [
    { title: 'Scale Line 2 to 90% load', impact: 'High', status: 'Adopted', tone: '#10b981' },
    { title: 'Reorder 500 silicon sensors (fast-track)', impact: 'High', status: 'Adopted', tone: '#10b981' },
    { title: 'Re-route packing load Line 3 → Line 4', impact: 'Medium', status: 'Pending', tone: '#f59e0b' },
    { title: 'Defer non-critical QA batch to night shift', impact: 'Low', status: 'Dismissed', tone: '#6b7280' },
  ],
};
