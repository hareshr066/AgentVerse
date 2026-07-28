import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  RefreshCw, 
  MapPin, 
  Clock, 
  CloudSun, 
  Newspaper, 
  Activity, 
  CheckCircle2, 
  Play, 
  FileText,
  AlertTriangle,
  Archive,
  Truck,
  Database
} from 'lucide-react';

import BackgroundGrid from './components/BackgroundGrid';
import Sidebar from './components/Sidebar';
import Spotlight from './components/Spotlight';
import SplineScene from './components/SplineScene';
import LiveChart from './components/LiveChart';

// Existing production components
import ProductionForm from './components/ProductionForm';
import ProductionResult from './components/ProductionResult';
import RecommendationForm from './components/RecommendationForm';
import RecommendationResult from './components/RecommendationResult';

// API Client
import {
  checkEventHealth,
  checkDemandHealth,
  checkInventoryHealth,
  checkSupplyHealth,
  checkProductionHealth,
  checkRecommendationHealth,
  checkOrchestratorHealth,
  getEventScore,
  predictDemand,
  calculateInventory,
  analyzeSupply,
  generateProductionPlan,
  generateRecommendation,
  triggerSyncPipeline,
  getEventsHistory,
  getDemandHistory,
  getPipelineHistory
} from './api/agents';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statuses, setStatuses] = useState({
    event: 'checking',
    demand: 'checking',
    inventory: 'checking',
    supply: 'checking',
    production: 'checking',
    recommendation: 'checking',
    orchestrator: 'checking'
  });
  const [refreshing, setRefreshing] = useState(false);

  // General App Errors
  const [appError, setAppError] = useState(null);

  // Tab 1: Pipeline Gateway Swarm State
  const [pipeProduct, setPipeProduct] = useState('PROD-101');
  const [pipeCity, setPipeCity] = useState('Delhi');
  const [pipeStock, setPipeStock] = useState(2500);
  const [pipeLoading, setPipeLoading] = useState(false);
  const [pipeLogs, setPipeLogs] = useState([]);
  const [pipeResult, setPipeResult] = useState(null);

  // Tab 2: Event Agent State
  const [evtProduct, setEvtProduct] = useState('Air Conditioner');
  const [evtCity, setEvtCity] = useState('Delhi');
  const [evtLoading, setEvtLoading] = useState(false);
  const [evtResult, setEvtResult] = useState(null);

  // Tab 3: Demand Agent State
  const [demProduct, setDemProduct] = useState('Air Conditioner');
  const [demCity, setDemCity] = useState('Delhi');
  const [demStock, setDemStock] = useState(4500);
  const [demSales, setDemSales] = useState('100, 110, 105, 120, 130');
  const [demLoading, setDemLoading] = useState(false);
  const [demResult, setDemResult] = useState(null);

  // Tab 4: Inventory Agent State
  const [invProduct, setInvProduct] = useState('Air Conditioner');
  const [invForecast, setInvForecast] = useState(12000);
  const [invStock, setInvStock] = useState(4500);
  const [invDaily, setInvDaily] = useState(50);
  const [invLead, setInvLead] = useState(5);
  const [invLoading, setInvLoading] = useState(false);
  const [invResult, setInvResult] = useState(null);

  // Tab 5: Supply Agent State
  const [supName, setSupName] = useState('Global Logistics Ltd');
  const [supExpected, setSupExpected] = useState(5);
  const [supActual, setSupActual] = useState(9);
  const [supRating, setSupRating] = useState(4.2);
  const [supLoading, setSupLoading] = useState(false);
  const [supResult, setSupResult] = useState(null);

  // Tab 6: Production Agent State
  const [prodLoading, setProdLoading] = useState(false);
  const [prodResult, setProdResult] = useState(null);

  // Tab 7: Recommendation Agent State
  const [recLoading, setRecLoading] = useState(false);
  const [recResult, setRecResult] = useState(null);
  // Prefill input fields
  const [recProduct, setRecProduct] = useState('Air Conditioner');
  const [recForecast, setRecForecast] = useState(12000);
  const [recStock, setRecStock] = useState(4500);
  const [recSafety, setRecSafety] = useState(1000);
  const [recStatus, setRecStatus] = useState('LOW');
  const [recProdQty, setRecProdQty] = useState(8500);
  const [recProdDays, setRecProdDays] = useState(9.44);
  const [recProdUtil, setRecProdUtil] = useState('100.00%');
  const [recProdPriority, setRecProdPriority] = useState('HIGH');
  const [recSupDelay, setRecSupDelay] = useState(true);
  const [recSupDelayDays, setRecSupDelayDays] = useState(4);
  const [recSupReliability, setRecSupReliability] = useState(0.85);

  // Tab 8: Database History State
  const [dbTab, setDbTab] = useState('pipeline'); // 'pipeline' | 'events' | 'demand'
  const [dbRecords, setDbRecords] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Run health check on mount
  useEffect(() => {
    checkAllHealth();
  }, []);

  // Fetch db records when db tab changes or Tab 8 becomes active
  useEffect(() => {
    if (activeTab === 'history') {
      fetchDbHistory();
    }
  }, [activeTab, dbTab]);

  // Clear app-wide API errors when active tab changes
  useEffect(() => {
    setAppError(null);
  }, [activeTab]);

  const checkAllHealth = async () => {
    setRefreshing(true);
    setStatuses({
      event: 'checking',
      demand: 'checking',
      inventory: 'checking',
      supply: 'checking',
      production: 'checking',
      recommendation: 'checking',
      orchestrator: 'checking'
    });

    const checks = await Promise.allSettled([
      checkEventHealth(),
      checkDemandHealth(),
      checkInventoryHealth(),
      checkSupplyHealth(),
      checkProductionHealth(),
      checkRecommendationHealth(),
      checkOrchestratorHealth()
    ]);

    setStatuses({
      event: checks[0].status === 'fulfilled' ? 'online' : 'offline',
      demand: checks[1].status === 'fulfilled' ? 'online' : 'offline',
      inventory: checks[2].status === 'fulfilled' ? 'online' : 'offline',
      supply: checks[3].status === 'fulfilled' ? 'online' : 'offline',
      production: checks[4].status === 'fulfilled' ? 'online' : 'offline',
      recommendation: checks[5].status === 'fulfilled' ? 'online' : 'offline',
      orchestrator: checks[6].status === 'fulfilled' ? 'online' : 'offline'
    });
    setRefreshing(false);
  };

  // 1. Pipeline trigger
  const handlePipelineSubmit = async (e) => {
    e.preventDefault();
    setPipeLoading(true);
    setPipeResult(null);
    setAppError(null);
    setPipeLogs(["[0s] Dispatching sync transaction to Orchestrator Swarm..."]);

    try {
      const historyArr = demSales.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      const res = await triggerSyncPipeline({
        product_id: pipeProduct,
        city: pipeCity,
        current_stock: Number(pipeStock),
        sales_history: historyArr.length ? historyArr : [100.0, 110.0, 105.0, 120.0, 130.0],
        daily_demand: 12,
        lead_time: 4
      });

      setPipeResult(res);
      setPipeLogs(res.pipeline_logs || []);
    } catch (err) {
      setAppError(err.message);
      setPipeLogs(prev => [...prev, `[ERROR] Workflow coordination aborted: ${err.message}`]);
    } finally {
      setPipeLoading(false);
    }
  };

  // 2. Event Score
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEvtLoading(true);
    setEvtResult(null);
    setAppError(null);
    try {
      const data = await getEventScore(evtProduct, evtCity);
      setEvtResult(data);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setEvtLoading(false);
    }
  };

  // 3. Demand prediction
  const handleDemandSubmit = async (e) => {
    e.preventDefault();
    setDemLoading(true);
    setDemResult(null);
    setAppError(null);
    try {
      const historyArr = demSales.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      const data = await predictDemand({
        product_id: demProduct,
        city: demCity,
        inventory: Number(demStock),
        sales_history: historyArr.length ? historyArr : [100.0, 110.0, 105.0, 120.0, 130.0],
        events: [],
        weather: {}
      });
      setDemResult(data);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setDemLoading(false);
    }
  };

  // 4. Inventory optimizer
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    setInvLoading(true);
    setInvResult(null);
    setAppError(null);
    try {
      const data = await calculateInventory({
        product: invProduct,
        forecast_demand: Number(invForecast),
        current_stock: Number(invStock),
        daily_demand: Number(invDaily),
        lead_time: Number(invLead)
      });
      setInvResult(data);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setInvLoading(false);
    }
  };

  // 5. Supply analysis
  const handleSupplySubmit = async (e) => {
    e.preventDefault();
    setSupLoading(true);
    setSupResult(null);
    setAppError(null);
    try {
      const data = await analyzeSupply({
        supplier_name: supName,
        expected_delivery_days: Number(supExpected),
        actual_delivery_days: Number(supActual),
        supplier_rating: Number(supRating)
      });
      setSupResult(data);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setSupLoading(false);
    }
  };

  // 6. Production plan
  const handleProductionSubmit = async (payload) => {
    setProdLoading(true);
    setProdResult(null);
    setAppError(null);
    try {
      const data = await generateProductionPlan(payload);
      setProdResult(data);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setProdLoading(false);
    }
  };

  // 7. Executive recommendation
  const handleRecommendationSubmit = async (e) => {
    e.preventDefault();
    setRecLoading(true);
    setRecResult(null);
    setAppError(null);
    try {
      const payload = {
        demand: {
          product: recProduct,
          forecast_demand: Number(recForecast),
          forecast_period_days: 30
        },
        inventory: {
          current_inventory: Number(recStock),
          safety_stock: Number(recSafety),
          inventory_status: recStatus
        },
        supply: {
          supplier_delay: recSupDelay,
          delay_days: Number(recSupDelayDays),
          supplier_reliability: Number(recSupReliability)
        },
        production: {
          production_quantity: Number(recProdQty),
          production_days: Number(recProdDays),
          capacity_utilization: recProdUtil,
          priority: recProdPriority
        }
      };
      const data = await generateRecommendation(payload);
      setRecResult(data);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setRecLoading(false);
    }
  };

  // 8. DB Explorer Fetcher
  const fetchDbHistory = async () => {
    setDbLoading(true);
    setDbRecords([]);
    setAppError(null);
    try {
      let data = [];
      if (dbTab === 'pipeline') {
        data = await getPipelineHistory();
      } else if (dbTab === 'events') {
        data = await getEventsHistory();
      } else if (dbTab === 'demand') {
        data = await getDemandHistory();
      }
      setDbRecords(data || []);
    } catch (err) {
      setAppError(err.message);
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Background visual components */}
      <BackgroundGrid />
      <Spotlight />

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        statuses={statuses} 
        onRefresh={checkOrchestratorHealth} 
        refreshing={refreshing} 
      />

      {/* Main Content Pane */}
      <main className="content-pane">
        <div className="page-wrapper">
          
          {appError && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span><strong>API Error:</strong> {appError}</span>
            </div>
          )}

          {/* Tab Content Router */}

          {/* ────────────────────────────────────────────────────────
              PAGE: PIPELINE GATEWAY (DASHBOARD)
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="hero-splite">
                <div className="hero-left">
                  <span className="hero-tag">Unified Agent Mesh</span>
                  <h1 className="hero-title">
                    Experience liftoff with <span>ManuSphere AI</span> swarms.
                  </h1>
                  <p className="hero-description">
                    Orchestrate six autonomous agents through our secure, real-time pipeline.
                    Analyze news signals, forecast demand, optimize safety stock, measure supplier risks,
                    and compute machine timelines using advanced Gemini API capabilities.
                  </p>
                  
                  <form className="hero-actions" onSubmit={handlePipelineSubmit}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={pipeProduct} 
                      onChange={(e) => setPipeProduct(e.target.value)} 
                      placeholder="Product ID (e.g., PROD-101)" 
                      style={{ maxWidth: '200px' }}
                      required
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={pipeCity} 
                      onChange={(e) => setPipeCity(e.target.value)} 
                      placeholder="City Name" 
                      style={{ maxWidth: '140px' }}
                      required
                    />
                    <button type="submit" className="btn-primary" disabled={pipeLoading}>
                      {pipeLoading ? <span className="spinning"><RefreshCw size={15} /></span> : <Play size={15} />}
                      <span>Execute Workflow</span>
                    </button>
                  </form>
                </div>

                <div className="hero-right">
                  <SplineScene />
                </div>
              </div>

              {/* Swarm Live Logging Terminal */}
              {(pipeLoading || pipeResult) && (
                <div className="card pipeline-panel" style={{ marginTop: '2rem' }}>
                  <div className="result-header">
                    <Activity size={18} color="#14b8a6" />
                    <span>Real-time Swarm Logs — <strong>{pipeProduct}</strong> ({pipeCity})</span>
                    <span className={`result-indicator-badge ${pipeResult ? 'green' : 'amber'}`}>
                      {pipeLoading ? 'Running Pipeline' : 'Sync Complete'}
                    </span>
                  </div>

                  <div className="pipeline-logs">
                    {pipeLogs.map((log, index) => (
                      <div key={index} className="log-entry">
                        <span className="log-time">[{index}]</span>
                        <span className="log-text">{log}</span>
                      </div>
                    ))}
                  </div>

                  {pipeResult && (
                    <div className="result-box" style={{ marginTop: '1rem' }}>
                      <div className="form-section-title">Workflow Synthesis Output</div>
                      
                      <div className="metric-grid">
                        <div className="metric-card">
                          <span className="metric-label">Forecast Demand</span>
                          <span className="metric-value">{pipeResult.demand_data?.predicted_demand} units</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Safety Stock Level</span>
                          <span className="metric-value">{pipeResult.inventory_data?.safety_stock} units</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Supplier Status</span>
                          <span className="metric-value" style={{ color: pipeResult.inventory_data?.stock_status === 'LOW' ? '#fc413d' : '#00b95c' }}>
                            {pipeResult.inventory_data?.stock_status}
                          </span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Decision Status</span>
                          <span className="metric-value">{pipeResult.decision_recommendation?.decision_status}</span>
                        </div>
                      </div>

                      {pipeResult.decision_recommendation?.summary && (
                        <div className="exec-summary" style={{ marginTop: '0.5rem' }}>
                          <div className="exec-summary-label">Executive Action Plan</div>
                          <p>{pipeResult.decision_recommendation.summary}</p>
                          {pipeResult.decision_recommendation.action_items && (
                            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {pipeResult.decision_recommendation.action_items.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Real-time Swarm Telemetry Chart */}
              <div className="card" style={{ marginTop: '2rem' }}>
                <LiveChart />
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              PAGE: EVENT INTEL AGENT
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'event' && (
            <div>
              <div className="page-header">
                <div className="page-title-box">
                  <div className="page-title-icon"><Newspaper size={24} color="#3186ff" /></div>
                  <h1 className="page-title">Event Parsing Agent</h1>
                </div>
                <p className="page-desc">Parses telemetry signals, weather indexes, Google search trends, and local news articles to compute geographic risk impact.</p>
              </div>

              <div className="agent-grid-layout">
                <div className="card">
                  <form className="agent-form" onSubmit={handleEventSubmit}>
                    <div className="form-section-title">Agent Prompt Parameters</div>
                    
                    <div className="form-field">
                      <label className="form-label">Product Name</label>
                      <input type="text" className="form-input" value={evtProduct} onChange={(e) => setEvtProduct(e.target.value)} required />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Target City</label>
                      <input type="text" className="form-input" value={evtCity} onChange={(e) => setEvtCity(e.target.value)} required />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={evtLoading}>
                        {evtLoading ? <span className="spinning"><RefreshCw size={15} /></span> : <Zap size={15} />}
                        <span>Parse Signals</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="result-container">
                  {evtResult ? (
                    <div className="card result-box">
                      <div className="result-header">
                        <span>Event Signal Report — <strong>{evtProduct}</strong></span>
                        <span className={`result-indicator-badge ${evtResult.analysis?.impact_score > 75 ? 'red' : evtResult.analysis?.impact_score > 40 ? 'amber' : 'green'}`}>
                          Impact: {evtResult.analysis?.impact_score || 50}%
                        </span>
                      </div>

                      {evtResult.weather && (
                        <div className="weather-status-box">
                          <div className="weather-temp">{evtResult.weather.temperature}°C</div>
                          <div className="weather-info">
                            <span className="weather-city">{evtCity} Weather</span>
                            <span className="weather-desc">{evtResult.weather.condition} (Humidity: {evtResult.weather.humidity}%)</span>
                          </div>
                        </div>
                      )}

                      {evtResult.analysis?.reasoning && (
                        <div className="exec-summary">
                          <div className="exec-summary-label">Gemini Signal Analysis</div>
                          <p>{evtResult.analysis.reasoning}</p>
                        </div>
                      )}

                      <div className="form-section-title">Telemetry Sources</div>
                      <div className="news-grid">
                        {evtResult.news && evtResult.news.length > 0 ? (
                          evtResult.news.map((item, idx) => (
                            <div key={idx} className="news-card">
                              <span className="news-title">{item.title}</span>
                              <p className="news-description">{item.description}</p>
                              <div className="news-meta">
                                <span>{item.source}</span>
                                <span>{item.publishedAt}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="news-card" style={{ textAlign: 'center', color: 'var(--text-3)' }}>No major external events found.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)' }}>
                      Submit parameters to query the Event Parsing Agent Swarm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              PAGE: DEMAND FORECAST AGENT
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'demand' && (
            <div>
              <div className="page-header">
                <div className="page-title-box">
                  <div className="page-title-icon"><TrendingUp size={24} color="#8b5cf6" /></div>
                  <h1 className="page-title">Demand Forecast Agent</h1>
                </div>
                <p className="page-desc">Computes predictive market demand averages by processing sales data history along with real-time news impact values.</p>
              </div>

              <div className="agent-grid-layout">
                <div className="card">
                  <form className="agent-form" onSubmit={handleDemandSubmit}>
                    <div className="form-section-title">Forecast Model Inputs</div>
                    
                    <div className="form-field">
                      <label className="form-label">Product ID</label>
                      <input type="text" className="form-input" value={demProduct} onChange={(e) => setDemProduct(e.target.value)} required />
                    </div>

                    <div className="form-field">
                      <label className="form-label">City</label>
                      <input type="text" className="form-input" value={demCity} onChange={(e) => setDemCity(e.target.value)} required />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Current Stock level</label>
                      <input type="number" className="form-input" value={demStock} onChange={(e) => setDemStock(Number(e.target.value))} required />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Sales History <span className="form-hint">(Comma-separated)</span></label>
                      <input type="text" className="form-input" value={demSales} onChange={(e) => setDemSales(e.target.value)} required />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={demLoading}>
                        {demLoading ? <span className="spinning"><RefreshCw size={15} /></span> : <Zap size={15} />}
                        <span>Forecast Demand</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="result-container">
                  {demResult ? (
                    <div className="card result-box">
                      <div className="result-header">
                        <span>Demand Forecast — <strong>{demProduct}</strong></span>
                        <span className={`result-indicator-badge ${demResult.confidence > 0.8 ? 'green' : 'amber'}`}>
                          Confidence: {Math.round(demResult.confidence * 100)}%
                        </span>
                      </div>

                      <div className="metric-grid">
                        <div className="metric-card">
                          <span className="metric-label">Predicted Demand</span>
                          <span className="metric-value">{demResult.predicted_demand} units</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Recommended Order</span>
                          <span className="metric-value">{demResult.recommended_order} units</span>
                        </div>
                      </div>

                      {demResult.reasons && (
                        <div className="exec-summary">
                          <div className="exec-summary-label">Forecast Drivers & Drivers</div>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {demResult.reasons.map((reason, i) => (
                              <li key={i}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)' }}>
                      Submit parameters to calculate demand forecasts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              PAGE: INVENTORY AGENT
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'inventory' && (
            <div>
              <div className="page-header">
                <div className="page-title-box">
                  <div className="page-title-icon"><Archive size={24} color="#14b8a6" /></div>
                  <h1 className="page-title">Inventory Optimization Agent</h1>
                </div>
                <p className="page-desc">Computes safety stock thresholds, reorder alert levels, and calculates the optimal Economic Order Quantity (EOQ).</p>
              </div>

              <div className="agent-grid-layout">
                <div className="card">
                  <form className="agent-form" onSubmit={handleInventorySubmit}>
                    <div className="form-section-title">Stock Parameters</div>
                    
                    <div className="form-field">
                      <label className="form-label">Product Name</label>
                      <input type="text" className="form-input" value={invProduct} onChange={(e) => setInvProduct(e.target.value)} required />
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label">Forecasted Demand</label>
                        <input type="number" className="form-input" value={invForecast} onChange={(e) => setInvForecast(Number(e.target.value))} required />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Current Stock</label>
                        <input type="number" className="form-input" value={invStock} onChange={(e) => setInvStock(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label">Daily Demand Rate</label>
                        <input type="number" className="form-input" value={invDaily} onChange={(e) => setInvDaily(Number(e.target.value))} required />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Supplier Lead Time (days)</label>
                        <input type="number" className="form-input" value={invLead} onChange={(e) => setInvLead(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={invLoading}>
                        {invLoading ? <span className="spinning"><RefreshCw size={15} /></span> : <Zap size={15} />}
                        <span>Optimize Inventory</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="result-container">
                  {invResult ? (
                    <div className="card result-box">
                      <div className="result-header">
                        <span>Inventory Ratios — <strong>{invResult.product}</strong></span>
                        <span className={`result-indicator-badge ${invResult.inventory_status === 'HEALTHY' ? 'green' : invResult.inventory_status === 'MEDIUM' ? 'amber' : 'red'}`}>
                          Status: {invResult.inventory_status}
                        </span>
                      </div>

                      <div className="metric-grid">
                        <div className="metric-card">
                          <span className="metric-label">Safety Stock Buffer</span>
                          <span className="metric-value">{invResult.safety_stock} units</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Reorder Trigger Point</span>
                          <span className="metric-value">{invResult.reorder_point} units</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Economic Order Qty (EOQ)</span>
                          <span className="metric-value">{invResult.economic_order_quantity} units</span>
                        </div>
                      </div>

                      <p className="result-message" style={{ fontSize: '0.85rem', color: 'var(--text-2)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        {invResult.message}
                      </p>
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)' }}>
                      Submit parameters to optimize stock thresholds.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              PAGE: SUPPLY PROCUREMENT AGENT
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'supply' && (
            <div>
              <div className="page-header">
                <div className="page-title-box">
                  <div className="page-title-icon"><Truck size={24} color="#fc413d" /></div>
                  <h1 className="page-title">Supply Procurement Agent</h1>
                </div>
                <p className="page-desc">Analyzes supplier reliability metrics, assesses shipment delays, and automatically suggests alternative vendors if risk classifications exceed normal bounds.</p>
              </div>

              <div className="agent-grid-layout">
                <div className="card">
                  <form className="agent-form" onSubmit={handleSupplySubmit}>
                    <div className="form-section-title">Supplier Telemetry</div>
                    
                    <div className="form-field">
                      <label className="form-label">Supplier Name</label>
                      <input type="text" className="form-input" value={supName} onChange={(e) => setSupName(e.target.value)} required />
                    </div>

                    <div className="form-row-2">
                      <div className="form-field">
                        <label className="form-label">Expected Days</label>
                        <input type="number" className="form-input" value={supExpected} onChange={(e) => setSupExpected(Number(e.target.value))} required />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Actual Days</label>
                        <input type="number" className="form-input" value={supActual} onChange={(e) => setSupActual(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Supplier Quality Rating <span className="form-hint">(1.0 - 5.0)</span></label>
                      <input type="number" step="0.1" className="form-input" value={supRating} onChange={(e) => setSupRating(Number(e.target.value))} required />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={supLoading}>
                        {supLoading ? <span className="spinning"><RefreshCw size={15} /></span> : <Zap size={15} />}
                        <span>Analyze Supplier</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="result-container">
                  {supResult ? (
                    <div className="card result-box">
                      <div className="result-header">
                        <span>Supplier Audit — <strong>{supResult.supplier_name}</strong></span>
                        <span className={`result-indicator-badge ${supResult.risk === 'LOW' ? 'green' : supResult.risk === 'MEDIUM' ? 'amber' : 'red'}`}>
                          Risk: {supResult.risk}
                        </span>
                      </div>

                      <div className="metric-grid">
                        <div className="metric-card">
                          <span className="metric-label">Delivery Status</span>
                          <span className="metric-value" style={{ color: supResult.supplier_delay ? 'var(--rose)' : 'var(--green)' }}>
                            {supResult.supplier_delay ? 'DELAYED' : 'ON TIME'}
                          </span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Delay Amount</span>
                          <span className="metric-value">{supResult.delay_days} Days</span>
                        </div>
                      </div>

                      {supResult.recommended_supplier && (
                        <div className="exec-summary">
                          <div className="exec-summary-label">Procurement Swarm Recommendation</div>
                          <p>
                            {supResult.supplier_delay 
                              ? `Active delay detected. We recommend rerouting delivery batches to primary backup supplier: `
                              : `Supplier status is currently stable. Maintain primary operations. Backup contact list includes: `}
                            <strong>{supResult.recommended_supplier}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)' }}>
                      Submit parameters to inspect supply chain channels.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              PAGE: PRODUCTION AGENT
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'production' && (
            <div>
              <div className="page-header">
                <div className="page-title-box">
                  <div className="page-title-icon"><Factory size={24} color="#00b95c" /></div>
                  <h1 className="page-title">Production Scheduler Agent</h1>
                </div>
                <p className="page-desc">Computes optimum output targets, maps working day duration periods, and schedules unit allocations across available assembly lines.</p>
              </div>

              <div className="agent-grid-layout">
                <div className="card card-form">
                  <ProductionForm onSubmit={handleProductionSubmit} loading={prodLoading} />
                </div>

                <div className="result-container">
                  {prodResult ? (
                    <div className="card">
                      <ProductionResult data={prodResult} />
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)' }}>
                      Submit parameters to generate machine scheduling structures.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              PAGE: STRATEGIC RECOMMENDATION (GEMINI)
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'recommendation' && (
            <div>
              <div className="page-header">
                <div className="page-title-box">
                  <div className="page-title-icon"><Sparkles size={24} color="#8b5cf6" /></div>
                  <h1 className="page-title">AI Recommendation Agent</h1>
                </div>
                <p className="page-desc">Aggregates multi-agent metrics from all upstream engines and runs a Gemini LLM synthesis model to generate executive strategic directions.</p>
              </div>

              <div className="agent-grid-layout">
                <div className="card card-form">
                  <RecommendationForm 
                    onSubmit={handleRecommendationSubmit} 
                    loading={recLoading} 
                    productionResult={prodResult}
                  />
                </div>

                <div className="result-container">
                  {recResult ? (
                    <div className="card">
                      <RecommendationResult data={recResult} />
                    </div>
                  ) : (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)' }}>
                      Submit parameters to synthesize holistic executive actions.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              PAGE: DATABASE HISTORY EXPLORER
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="card">
              <div className="result-header" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} color="#3186ff" />
                  <span>SQLite Swarm Telemetry Database Explorer</span>
                </div>
                <button className="icon-btn" onClick={fetchDbHistory} disabled={dbLoading}>
                  <RefreshCw size={14} className={dbLoading ? 'spinning' : ''} />
                  <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>Reload Database</span>
                </button>
              </div>

              <div className="history-tab-group">
                <button className={`history-tab-btn ${dbTab === 'pipeline' ? 'active' : ''}`} onClick={() => setDbTab('pipeline')}>Pipeline Runs</button>
                <button className={`history-tab-btn ${dbTab === 'events' ? 'active' : ''}`} onClick={() => setDbTab('events')}>Event Predictions</button>
                <button className={`history-tab-btn ${dbTab === 'demand' ? 'active' : ''}`} onClick={() => setDbTab('demand')}>Demand Forecasts</button>
              </div>

              {dbLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-2)' }}>
                  <span className="spinning" style={{ display: 'inline-block', marginRight: '0.5rem' }}><RefreshCw size={16} /></span>
                  Loading telemetry records...
                </div>
              ) : (
                <div className="history-table-container">
                  {dbRecords.length > 0 ? (
                    <table className="history-table">
                      <thead>
                        {dbTab === 'pipeline' && (
                          <tr>
                            <th>ID</th>
                            <th>Timestamp</th>
                            <th>Product</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>Latency (ms)</th>
                            <th>Decision Status</th>
                          </tr>
                        )}
                        {dbTab === 'events' && (
                          <tr>
                            <th>ID</th>
                            <th>Timestamp</th>
                            <th>City</th>
                            <th>Event Name</th>
                            <th>Category</th>
                            <th>Impact Score</th>
                            <th>Weather</th>
                            <th>Temp (°C)</th>
                          </tr>
                        )}
                        {dbTab === 'demand' && (
                          <tr>
                            <th>ID</th>
                            <th>Timestamp</th>
                            <th>Product</th>
                            <th>City</th>
                            <th>Forecasted Demand</th>
                            <th>Confidence</th>
                            <th>Reorder Qty</th>
                            <th>Current Inventory</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {dbRecords.map((r, i) => (
                          <tr key={i}>
                            {dbTab === 'pipeline' && (
                              <>
                                <td><span className="machine-id-badge">PL-{r.id}</span></td>
                                <td style={{ color: 'var(--text-2)' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}</td>
                                <td><strong>{r.product_id}</strong></td>
                                <td>{r.city}</td>
                                <td>
                                  <span style={{ color: r.status === 'success' ? 'var(--green)' : 'var(--rose)', fontWeight: 700 }}>
                                    {r.status?.toUpperCase()}
                                  </span>
                                </td>
                                <td>{r.execution_time_ms}ms</td>
                                <td><span className="risk-factor-chip">{r.decision_status}</span></td>
                              </>
                            )}
                            {dbTab === 'events' && (
                              <>
                                <td><span className="machine-id-badge">EV-{r.id}</span></td>
                                <td style={{ color: 'var(--text-2)' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}</td>
                                <td><strong>{r.city}</strong></td>
                                <td>{r.event_name}</td>
                                <td><span className="risk-factor-chip">{r.category}</span></td>
                                <td style={{ color: r.impact_score > 60 ? 'var(--rose)' : 'var(--green)', fontWeight: 700 }}>
                                  {r.impact_score}%
                                </td>
                                <td>{r.weather_condition}</td>
                                <td>{r.temperature}°C</td>
                              </>
                            )}
                            {dbTab === 'demand' && (
                              <>
                                <td><span className="machine-id-badge">DE-{r.id}</span></td>
                                <td style={{ color: 'var(--text-2)' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}</td>
                                <td><strong>{r.product_id}</strong></td>
                                <td>{r.city}</td>
                                <td><strong>{r.predicted_demand} units</strong></td>
                                <td style={{ color: r.confidence > 0.8 ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>
                                  {Math.round(r.confidence * 100)}%
                                </td>
                                <td>{r.recommended_order} units</td>
                                <td>{r.inventory} units</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)' }}>
                      No persistent history records found for this model type.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
