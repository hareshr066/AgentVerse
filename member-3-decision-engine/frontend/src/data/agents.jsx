import {
  Radio, TrendingUp, Boxes, Truck, Factory, Sparkles
} from 'lucide-react';

// Central registry of the 6 platform agents. Every agent page and the
// overview dashboard are driven by this single source of truth.
export const agents = [
  {
    id: 'event',
    name: 'Event Parsing Agent',
    short: 'Event Agent',
    tagline: 'Real-time telemetry ingestion & anomaly extraction',
    owner: 'Member 1 · AI Intelligence',
    icon: Radio,
    accent: '#3b82f6',
    port: 8101,
    endpoint: '/api/v1/events',
    description:
      'Consumes raw factory telemetry streams, normalizes heterogeneous sensor payloads, and extracts structured events. Flags anomalies before they cascade downstream so the rest of the pipeline reasons over clean, typed signals.',
    capabilities: [
      'Schema-agnostic payload normalization',
      'Anomaly & outlier detection on live streams',
      'Event deduplication and enrichment',
      'Back-pressure aware ingestion buffering',
    ],
    metrics: [
      { label: 'Events / min', value: '12.4k', trend: '+8.2%', positive: true },
      { label: 'Parse Success', value: '99.7%', trend: '+0.3%', positive: true },
      { label: 'Avg Latency', value: '42 ms', trend: '-6 ms', positive: true },
      { label: 'Anomalies Today', value: '17', trend: '+3', positive: false },
    ],
    series: [
      { name: '08:00', primary: 9200, secondary: 12 },
      { name: '10:00', primary: 10800, secondary: 9 },
      { name: '12:00', primary: 12400, secondary: 21 },
      { name: '14:00', primary: 13100, secondary: 17 },
      { name: '16:00', primary: 11900, secondary: 8 },
      { name: '18:00', primary: 10200, secondary: 5 },
      { name: '20:00', primary: 8800, secondary: 3 },
    ],
    seriesLabels: { primary: 'Events', secondary: 'Anomalies' },
    activity: [
      { time: '20:41', text: 'Normalized batch of 2,304 telemetry frames from Line 2.' },
      { time: '20:39', text: 'Anomaly flagged: vibration spike on press #7.' },
      { time: '20:35', text: 'Schema drift auto-mapped for new sensor firmware v3.1.' },
    ],
  },
  {
    id: 'demand',
    name: 'Demand Forecast Agent',
    short: 'Demand Agent',
    tagline: 'Predictive demand modeling across SKUs',
    owner: 'Member 1 · AI Intelligence',
    icon: TrendingUp,
    accent: '#14b8a6',
    port: 8102,
    endpoint: '/api/v1/forecast',
    description:
      'Computes short and medium-term demand forecasts from parsed events and historical order data. Produces confidence-scored projections that drive inventory buffers and production scheduling.',
    capabilities: [
      'Seasonality-aware time-series forecasting',
      'Per-SKU and aggregate demand curves',
      'Confidence intervals on every projection',
      'What-if scenario simulation',
    ],
    metrics: [
      { label: 'Forecast MAPE', value: '6.1%', trend: '-1.4%', positive: true },
      { label: 'SKUs Modeled', value: '842', trend: '+12', positive: true },
      { label: 'Horizon', value: '14 days', trend: '', positive: true },
      { label: 'Confidence', value: '92%', trend: '+2%', positive: true },
    ],
    series: [
      { name: '08:00', primary: 120, secondary: 118 },
      { name: '10:00', primary: 150, secondary: 145 },
      { name: '12:00', primary: 180, secondary: 176 },
      { name: '14:00', primary: 210, secondary: 205 },
      { name: '16:00', primary: 190, secondary: 194 },
      { name: '18:00', primary: 140, secondary: 138 },
      { name: '20:00', primary: 110, secondary: 112 },
    ],
    seriesLabels: { primary: 'Forecast', secondary: 'Actual' },
    activity: [
      { time: '20:40', text: 'Refreshed 14-day forecast for automotive fasteners (+25%).' },
      { time: '20:31', text: 'Seasonal uplift detected across 6 SKUs.' },
      { time: '20:22', text: 'Confidence interval narrowed after new order intake.' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory Agent',
    short: 'Inventory Agent',
    tagline: 'Live stock levels & runway analysis',
    owner: 'Member 2 · Operations',
    icon: Boxes,
    accent: '#f59e0b',
    port: 8201,
    endpoint: '/api/v1/inventory',
    description:
      'Tracks raw materials, work-in-progress, and finished goods in real time. Cross-references demand forecasts to compute runway and surfaces low-stock alerts before shortages hit the line.',
    capabilities: [
      'Real-time stock ledger across warehouses',
      'Runway estimation vs. forecast demand',
      'Configurable low-stock thresholds & alerts',
      'Reorder point recommendations',
    ],
    metrics: [
      { label: 'SKUs Tracked', value: '1,204', trend: '+18', positive: true },
      { label: 'Low-Stock Alerts', value: '3', trend: '+1', positive: false },
      { label: 'Avg Runway', value: '9.4 days', trend: '-0.6', positive: false },
      { label: 'Turnover', value: '5.8x', trend: '+0.2x', positive: true },
    ],
    series: [
      { name: '08:00', primary: 400, secondary: 100 },
      { name: '10:00', primary: 380, secondary: 100 },
      { name: '12:00', primary: 360, secondary: 100 },
      { name: '14:00', primary: 350, secondary: 100 },
      { name: '16:00', primary: 350, secondary: 100 },
      { name: '18:00', primary: 360, secondary: 100 },
      { name: '20:00', primary: 400, secondary: 100 },
    ],
    seriesLabels: { primary: 'On Hand', secondary: 'Threshold' },
    activity: [
      { time: '20:38', text: 'Low-stock alert: Silicon Sensors at 45 units (threshold 100).' },
      { time: '20:29', text: 'Reorder point recommended for raw steel coils.' },
      { time: '20:18', text: 'Received 1,200 units of packaging film into WH-2.' },
    ],
  },
  {
    id: 'supply',
    name: 'Supply Procurement Agent',
    short: 'Supply Agent',
    tagline: 'Supplier orchestration & lead-time management',
    owner: 'Member 2 · Operations',
    icon: Truck,
    accent: '#f43f5e',
    port: 8202,
    endpoint: '/api/v1/procurement',
    description:
      'Automates procurement workflows across the supplier network. Ranks vendors by lead time, cost, and reliability, and triggers pre-approved purchase orders to keep the inventory buffer healthy.',
    capabilities: [
      'Multi-supplier scoring & selection',
      'Automated purchase-order drafting',
      'Lead-time and disruption monitoring',
      'Pre-approved fast-track channels',
    ],
    metrics: [
      { label: 'Active Suppliers', value: '38', trend: '+2', positive: true },
      { label: 'Open POs', value: '14', trend: '-3', positive: true },
      { label: 'Avg Lead Time', value: '11 days', trend: '-2', positive: true },
      { label: 'On-Time Rate', value: '96.2%', trend: '+1.1%', positive: true },
    ],
    series: [
      { name: 'Mon', primary: 8, secondary: 12 },
      { name: 'Tue', primary: 11, secondary: 10 },
      { name: 'Wed', primary: 9, secondary: 13 },
      { name: 'Thu', primary: 14, secondary: 11 },
      { name: 'Fri', primary: 12, secondary: 9 },
      { name: 'Sat', primary: 6, secondary: 7 },
      { name: 'Sun', primary: 4, secondary: 5 },
    ],
    seriesLabels: { primary: 'POs Placed', secondary: 'Deliveries' },
    activity: [
      { time: '20:37', text: 'Draft PO created for 500 sensor units via fast-track channel.' },
      { time: '20:26', text: 'Supplier ranked #1: local steel vendor (lead time 6 days).' },
      { time: '20:14', text: 'Container shipping delay flagged on route APAC-2.' },
    ],
  },
  {
    id: 'production',
    name: 'Production Scheduler Agent',
    short: 'Production Agent',
    tagline: 'Capacity planning & job sequencing',
    owner: 'Member 3 · Decision Engine',
    icon: Factory,
    accent: '#8b5cf6',
    port: 8301,
    endpoint: '/api/v1/production',
    description:
      'Structures production schedules from demand forecasts and material availability. Balances line capacity, sequences jobs, and re-routes load to avoid bottlenecks and maximize equipment effectiveness.',
    capabilities: [
      'Constraint-based job sequencing',
      'Line capacity & utilization balancing',
      'Bottleneck detection and re-routing',
      'Maintenance-window aware scheduling',
    ],
    metrics: [
      { label: 'OEE', value: '88.4%', trend: '+1.2%', positive: true },
      { label: 'Active Lines', value: '4 / 5', trend: '', positive: true },
      { label: 'Queued Jobs', value: '27', trend: '-4', positive: true },
      { label: 'Waste Rate', value: '1.2%', trend: '-0.3%', positive: true },
    ],
    series: [
      { name: 'Line 1', primary: 82, secondary: 100 },
      { name: 'Line 2', primary: 90, secondary: 100 },
      { name: 'Line 3', primary: 92, secondary: 100 },
      { name: 'Line 4', primary: 68, secondary: 100 },
      { name: 'Line 5', primary: 0, secondary: 100 },
    ],
    seriesLabels: { primary: 'Utilization', secondary: 'Capacity' },
    activity: [
      { time: '20:36', text: 'Line 3 at 92% utilization — re-routing packing load to Line 4.' },
      { time: '20:24', text: 'Scheduled maintenance window opens for Line 5 in 4h.' },
      { time: '20:11', text: 'Sequenced 27 jobs for the evening shift.' },
    ],
  },
  {
    id: 'recommendation',
    name: 'Gemini Recommendation Agent',
    short: 'Recommendation Agent',
    tagline: 'LLM-powered optimization & natural-language decisions',
    owner: 'Member 3 · Decision Engine',
    icon: Sparkles,
    accent: '#10b981',
    port: 8302,
    endpoint: '/api/v1/recommendation',
    description:
      'Synthesizes signals from every upstream agent and uses Google Gemini to generate auditable, natural-language optimization plans. The final decision layer that turns data into action.',
    capabilities: [
      'Cross-agent context aggregation',
      'Gemini-powered natural-language plans',
      'Auditable recommendation trail',
      'Actionable next-step generation',
    ],
    metrics: [
      { label: 'Recs Today', value: '146', trend: '+22', positive: true },
      { label: 'Adoption Rate', value: '81%', trend: '+4%', positive: true },
      { label: 'Avg Gen Time', value: '1.4 s', trend: '-0.2s', positive: true },
      { label: 'Model', value: 'Gemini', trend: '', positive: true },
    ],
    series: [
      { name: '08:00', primary: 12, secondary: 9 },
      { name: '10:00', primary: 18, secondary: 15 },
      { name: '12:00', primary: 24, secondary: 20 },
      { name: '14:00', primary: 30, secondary: 26 },
      { name: '16:00', primary: 22, secondary: 19 },
      { name: '18:00', primary: 20, secondary: 17 },
      { name: '20:00', primary: 20, secondary: 18 },
    ],
    seriesLabels: { primary: 'Generated', secondary: 'Adopted' },
    activity: [
      { time: '20:42', text: 'Plan generated: scale Line 2 to 90%, reorder steel coils.' },
      { time: '20:33', text: 'Recommendation adopted by operations lead.' },
      { time: '20:20', text: 'Aggregated context from 5 upstream agents.' },
    ],
  },
];

export const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

export const pipeline = [
  { step: 1, agent: 'event', label: 'Ingest', text: 'Telemetry parsed for anomalies.' },
  { step: 2, agent: 'demand', label: 'Forecast', text: 'Predictive demand computed.' },
  { step: 3, agent: 'inventory', label: 'Runway', text: 'Stock & material runway checked.' },
  { step: 4, agent: 'supply', label: 'Procure', text: 'Supplier orders orchestrated.' },
  { step: 5, agent: 'production', label: 'Schedule', text: 'Capacity & jobs sequenced.' },
  { step: 6, agent: 'recommendation', label: 'Decide', text: 'Gemini generates the plan.' },
];

export const platformFeatures = [
  {
    icon: Radio,
    title: 'Unified Telemetry Bus',
    text: 'Every agent subscribes to a shared event stream for consistent, real-time state.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Intelligence',
    text: 'Forecasting and anomaly detection anticipate issues before they reach the floor.',
  },
  {
    icon: Sparkles,
    title: 'Gemini Copilot',
    text: 'Natural-language optimization plans synthesized from all upstream agents.',
  },
  {
    icon: Factory,
    title: 'Closed-Loop Automation',
    text: 'From sensor signal to procurement order, decisions flow end-to-end automatically.',
  },
];
