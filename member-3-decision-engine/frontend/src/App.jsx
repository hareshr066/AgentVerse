import React, { useState } from 'react';
import { 
  Activity, Database, Cpu, TrendingUp, AlertTriangle, 
  RefreshCw, Layers, ShieldAlert, BarChart3, Settings, Play
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const mockChartData = [
  { name: '08:00', Demand: 120, Production: 100, Inventory: 400 },
  { name: '10:00', Demand: 150, Production: 130, Inventory: 380 },
  { name: '12:00', Demand: 180, Production: 160, Inventory: 360 },
  { name: '14:00', Demand: 210, Production: 200, Inventory: 350 },
  { name: '16:00', Demand: 190, Production: 190, Inventory: 350 },
  { name: '18:00', Demand: 140, Production: 150, Inventory: 360 },
  { name: '20:00', Demand: 110, Production: 120, Inventory: 400 },
];

export default function App() {
  const [geminiPrompt, setGeminiPrompt] = useState(
    "Analyze inventory and recommend optimization actions for peak hour bottlenecks."
  );
  const [recommendation, setRecommendation] = useState(
    "AI Insight: Current inventory of parts represents 2 days of runway. Demand is expected to rise by 25% due to seasonal automotive orders. Recommendation: Scale Production line 2 to 90% load and initiate procurement of primary raw steel coils via pre-approved local supply channels to mitigate potential container shipping delays."
  );
  const [loading, setLoading] = useState(false);

  const handleGenerateRecommendation = () => {
    setLoading(true);
    setTimeout(() => {
      setRecommendation(
        `AI Optimization Plan [Generated]:\n\n1. Inventory: Buffer levels are healthy for standard operations. However, critical micro-controllers are showing lead times of 18 days.\n2. Bottleneck: Line 3 (Packaging) is near peak utilization (92%).\n3. Action: Re-route secondary assembly flow to Line 4 to distribute packing load. Reorder 500 units of sensors immediately.`
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="dashboard-container">
      <header>
        <div className="logo-container">
          <h1>ManuSphere AI</h1>
          <p>Multi-Agent Manufacturing Intelligence Platform</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="status-badge status-online">● Orchestrator Connected</span>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <RefreshCw size={16} /> Sync Pipeline
          </button>
        </div>
      </header>

      <main className="main-content">
        
        {/* Module 1: System Node Health */}
        <div className="card span-4">
          <div className="card-title">
            <Cpu size={18} color="#3b82f6" /> Agent Node Connectivity
          </div>
          <div className="status-grid">
            <div className="status-item">
              <span>Event Agent</span>
              <span className="status-badge status-online">Online</span>
            </div>
            <div className="status-item">
              <span>Demand Agent</span>
              <span className="status-badge status-online">Online</span>
            </div>
            <div className="status-item">
              <span>Inventory Agent</span>
              <span className="status-badge status-online">Online</span>
            </div>
            <div className="status-item">
              <span>Supply Agent</span>
              <span className="status-badge status-online">Online</span>
            </div>
            <div className="status-item">
              <span>Production Agent</span>
              <span className="status-badge status-online">Online</span>
            </div>
            <div className="status-item">
              <span>Recommendation Agent</span>
              <span className="status-badge status-online">Online</span>
            </div>
          </div>
        </div>

        {/* Module 2: Key Telemetry */}
        <div className="card span-4">
          <div className="card-title">
            <Activity size={18} color="#14b8a6" /> Operational Metrics
          </div>
          <div>
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-secondary)' }}>Overall Equipment Effectiveness</span>
              <span style={{ fontWeight: '600' }}>88.4%</span>
            </div>
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-secondary)' }}>Active Production Lines</span>
              <span style={{ fontWeight: '600' }}>4 / 5</span>
            </div>
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-secondary)' }}>Material Waste Rate</span>
              <span style={{ fontWeight: '600', color: '#10b981' }}>1.2%</span>
            </div>
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-secondary)' }}>Open Incidents</span>
              <span style={{ fontWeight: '600', color: '#f43f5e' }}>0</span>
            </div>
          </div>
        </div>

        {/* Module 3: Active Incidents / Warnings */}
        <div className="card span-4">
          <div className="card-title">
            <ShieldAlert size={18} color="#f43f5e" /> Active Warnings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', borderLeft: '4px solid #f43f5e', padding: '0.75rem', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Low Stock Alert: Silicon Sensors</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inventory level at 45 units (Threshold: 100 units). Lead time 14 days.</p>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '0.75rem', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f59e0b' }}>Line 3 Packaging Maintenance</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scheduled maintenance window opens in 4 hours. Throughput might scale down.</p>
            </div>
          </div>
        </div>

        {/* Charts: Real-time Forecasting / Production */}
        <div className="card span-8">
          <div className="card-title">
            <BarChart3 size={18} color="#8b5cf6" /> Demand vs Production & Inventory Levels
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                <Area type="monotone" dataKey="Demand" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDemand)" />
                <Area type="monotone" dataKey="Production" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProduction)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gemini API Copilot Panel */}
        <div className="card span-4">
          <div className="card-title">
            <Layers size={18} color="#eab308" /> Gemini Intelligence Copilot
          </div>
          <div>
            <textarea 
              className="prompt-area" 
              value={geminiPrompt}
              onChange={(e) => setGeminiPrompt(e.target.value)}
            />
            <button 
              className="btn-primary" 
              onClick={handleGenerateRecommendation}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
              Generate AI Recommendation
            </button>
            <div className="recommendation-box">
              {recommendation}
            </div>
          </div>
        </div>

        {/* System Workflow Pipeline Visualization */}
        <div className="card span-12">
          <div className="card-title">
            <Settings size={18} color="#10b981" /> Multi-Agent Collaboration Protocol
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#3b82f6', fontWeight: '600' }}>Step 1: Event Broker</span>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Telemetry data stream is parsed by Event Agent for anomalies.</p>
            </div>
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#14b8a6', fontWeight: '600' }}>Step 2: Forecast</span>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Demand Agent computes predictive trend based on current events.</p>
            </div>
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#8b5cf6', fontWeight: '600' }}>Step 3: Check Runway</span>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Inventory & Supply Agents analyze raw materials and parts runway.</p>
            </div>
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f59e0b', fontWeight: '600' }}>Step 4: Scheduler</span>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Production Agent updates capacity and jobs queue based on metrics.</p>
            </div>
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981', fontWeight: '600' }}>Step 5: LLM Audit</span>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Recommendation Agent generates natural language decisions via Gemini.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
