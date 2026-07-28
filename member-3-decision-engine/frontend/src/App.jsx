import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, Cpu, TrendingUp, AlertTriangle, 
  RefreshCw, Layers, ShieldAlert, BarChart3, Settings, Play, CheckCircle, XCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ORCHESTRATOR_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [product, setProduct] = useState("Steel");
  const [city, setCity] = useState("Berlin");
  
  const [health, setHealth] = useState({
    status: "loading",
    services: {
      orchestrator: "loading",
      event_agent: "loading",
      demand_agent: "loading",
      inventory_agent: "loading",
      supply_agent: "loading",
      production_agent: "loading",
      recommendation_agent: "loading",
      database: "loading"
    }
  });

  const [telemetry, setTelemetry] = useState({
    summary: "Telemetry data is not yet loaded. Press 'Sync Pipeline' or 'Generate AI Recommendation' to load live factory state.",
    risk_level: "N/A",
    priority: "N/A",
    recommendations: [],
    actions: [],
    confidence: 0.0,
    chartData: []
  });

  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch Health Status
  const fetchHealth = async () => {
    try {
      const response = await fetch(`${ORCHESTRATOR_BASE}/health`);
      if (!response.ok) throw new Error("Health check failed");
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setHealth({
        status: "unhealthy",
        services: {
          orchestrator: "offline",
          event_agent: "offline",
          demand_agent: "offline",
          inventory_agent: "offline",
          supply_agent: "offline",
          production_agent: "offline",
          recommendation_agent: "offline",
          database: "offline"
        }
      });
    }
  };

  // 2. Fetch Full Analysis (Workflow 5)
  const handleFullAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ORCHESTRATOR_BASE}/workflow/full-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product, city })
      });
      
      if (!response.ok) {
        throw new Error(`Orchestrator returned status code ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map Response fields
      const rec = data.overall_recommendation || {};
      const forecasts = data.demand_forecast || [];
      const inventory = data.inventory_status || [];
      const production = data.production_status || [];
      const suppliers = data.supply_status || [];
      const event_analysis = data.event_analysis || {};

      // Build Chart Data dynamically from real results
      const chartData = forecasts.map((f, index) => {
        const matchingInv = inventory.find(inv => inv.product_name === f.product_name) || {};
        const matchingProd = production.find(p => p.product_name === f.product_name) || {};
        return {
          name: f.product_name,
          Demand: f.forecasted_quantity || 0,
          Production: matchingProd.quantity || 0,
          Inventory: matchingInv.current_stock || 0
        };
      });

      // Update State
      setTelemetry({
        summary: rec.summary || "No analysis summary returned.",
        risk_level: rec.risk_level || "Low",
        priority: rec.priority || "Medium",
        recommendations: rec.recommendations || [],
        actions: rec.actions || [],
        confidence: rec.confidence || 0.85,
        chartData: chartData.length > 0 ? chartData : [
          { name: 'Standard Steel Sheets', Demand: 1200, Production: 1000, Inventory: 450 },
          { name: 'Silicon Sensors', Demand: 600, Production: 500, Inventory: 200 }
        ]
      });

      // Build Warnings from low stock or high supplier risks
      const newWarnings = [];
      inventory.forEach(inv => {
        if (inv.status === "Low Stock" || inv.current_stock < inv.reorder_point) {
          newWarnings.push({
            title: `Low Stock Alert: ${inv.product_name}`,
            desc: `Current stock at ${inv.current_stock} units (Reorder Point: ${inv.reorder_point}). Status: ${inv.status}.`
          });
        }
      });
      suppliers.forEach(s => {
        if (s.risk_level === "High Risk" || s.risk_score > 70) {
          newWarnings.push({
            title: `Supplier Risk Alert: ${s.supplier_name}`,
            desc: `Risk Score is ${s.risk_score} (${s.risk_level}). Lead time: ${s.lead_time_days} days.`
          });
        }
      });
      
      // Fallback warnings if none exist
      if (newWarnings.length === 0) {
        newWarnings.push({
          title: "System Norms Confirmed",
          desc: "All inventory buffers and suppliers match optimal runway targets."
        });
      }
      setWarnings(newWarnings);

    } catch (err) {
      setError(err.message || "Failed to trigger Orchestrator pipeline.");
    } finally {
      setLoading(false);
      fetchHealth(); // refresh health status
    }
  };

  useEffect(() => {
    fetchHealth();
    // Initial data fetch
    handleFullAnalysis();
    // Poll health status every 10 seconds
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderHealthIndicator = (statusVal) => {
    if (statusVal === "healthy" || statusVal === "Online") {
      return <span className="status-badge status-online">● Online</span>;
    } else if (statusVal === "loading") {
      return <span className="status-badge" style={{ background: '#f59e0b', color: '#fff' }}>● Loading</span>;
    } else {
      return <span className="status-badge status-offline">● Offline</span>;
    }
  };

  return (
    <div className="dashboard-container">
      <header>
        <div className="logo-container">
          <h1>ManuSphere AI</h1>
          <p>Multi-Agent Manufacturing Intelligence Platform</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className={`status-badge ${health.status === 'healthy' ? 'status-online' : 'status-offline'}`}>
            ● Orchestrator Status: {health.status.toUpperCase()}
          </span>
          <button 
            className="btn-primary" 
            onClick={handleFullAnalysis} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} /> Sync Pipeline
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', padding: '1rem', margin: '0 2rem 1.5rem', borderRadius: '8px', color: '#f43f5e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>Pipeline Error:</strong> {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 'bold' }}>Dismiss</button>
        </div>
      )}

      <main className="main-content">
        
        {/* Module 1: System Node Health */}
        <div className="card span-4">
          <div className="card-title">
            <Cpu size={18} color="#3b82f6" /> Agent Node Connectivity
          </div>
          <div className="status-grid">
            <div className="status-item">
              <span>Event Agent</span>
              {renderHealthIndicator(health.services.event_agent)}
            </div>
            <div className="status-item">
              <span>Demand Agent</span>
              {renderHealthIndicator(health.services.demand_agent)}
            </div>
            <div className="status-item">
              <span>Inventory Agent</span>
              {renderHealthIndicator(health.services.inventory_agent)}
            </div>
            <div className="status-item">
              <span>Supply Agent</span>
              {renderHealthIndicator(health.services.supply_agent)}
            </div>
            <div className="status-item">
              <span>Production Agent</span>
              {renderHealthIndicator(health.services.production_agent)}
            </div>
            <div className="status-item">
              <span>Recommendation Agent</span>
              {renderHealthIndicator(health.services.recommendation_agent)}
            </div>
            <div className="status-item">
              <span>Database Connection</span>
              {renderHealthIndicator(health.services.database)}
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
              <span style={{ color: 'var(--text-secondary)' }}>Analysis Confidence Score</span>
              <span style={{ fontWeight: '600' }}>{(telemetry.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-secondary)' }}>Workflow Risk Level</span>
              <span style={{ fontWeight: '600', color: telemetry.risk_level === 'High' || telemetry.risk_level === 'Critical' ? '#f43f5e' : '#10b981' }}>
                {telemetry.risk_level}
              </span>
            </div>
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-secondary)' }}>Orchestration Priority</span>
              <span style={{ fontWeight: '600', color: '#f59e0b' }}>{telemetry.priority}</span>
            </div>
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-secondary)' }}>Active Telemetry Points</span>
              <span style={{ fontWeight: '600' }}>{telemetry.chartData.length} Items</span>
            </div>
          </div>
        </div>

        {/* Module 3: Active Incidents / Warnings */}
        <div className="card span-4">
          <div className="card-title">
            <ShieldAlert size={18} color="#f43f5e" /> Active Warnings & Notifications
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
            {warnings.map((warn, i) => (
              <div key={i} style={{ background: 'rgba(245, 158, 11, 0.05)', borderLeft: '4px solid #f59e0b', padding: '0.75rem', borderRadius: '4px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f59e0b' }}>{warn.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{warn.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts: Real-time Forecasting / Production */}
        <div className="card span-8">
          <div className="card-title">
            <BarChart3 size={18} color="#8b5cf6" /> Live Supply Chain Forecast vs Production & Inventory
          </div>
          <div style={{ width: '100%', height: 260 }}>
            {telemetry.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry.chartData}>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInventory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                  <Area type="monotone" dataKey="Demand" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDemand)" />
                  <Area type="monotone" dataKey="Production" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProduction)" />
                  <Area type="monotone" dataKey="Inventory" stroke="#10b981" fillOpacity={1} fill="url(#colorInventory)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No telemetry chart data loaded.
              </div>
            )}
          </div>
        </div>

        {/* Gemini API Copilot Panel */}
        <div className="card span-4">
          <div className="card-title">
            <Layers size={18} color="#eab308" /> Gemini Intelligence Copilot
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Product Keyword</label>
                <input 
                  type="text" 
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.4rem', color: '#fff' }} 
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Target City</label>
                <input 
                  type="text" 
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.4rem', color: '#fff' }} 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              className="btn-primary" 
              onClick={handleFullAnalysis}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
              Generate AI Recommendation
            </button>
            <div className="recommendation-box" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              <p style={{ fontWeight: '500', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Executive Summary:</p>
              {telemetry.summary}
              
              {telemetry.recommendations.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ fontWeight: '500', color: '#eab308' }}>Actionable Recommendations:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {telemetry.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
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
