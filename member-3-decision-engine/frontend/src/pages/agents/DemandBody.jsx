import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Box,
  MapPin,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  LineChart as LineIcon,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sliders,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { predictDemand } from '../../api/agents.js';

export default function DemandBody({ agent }) {
  const [productId, setProductId] = useState('PROD-101');
  const [city, setCity] = useState('Delhi');
  const [inventory, setInventory] = useState(150);
  const [salesHistoryStr, setSalesHistoryStr] = useState('100, 110, 105, 120, 130');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const productExamples = ['PROD-101', 'PROD-202', 'LAPTOP-PRO', 'AC-UNIT'];
  const cityExamples = ['Delhi', 'Chennai', 'Mumbai', 'Bengaluru'];

  const loadingMessages = [
    'Fetching historical sales trends...',
    'Evaluating weather & event impact signals...',
    'Generating AI demand forecast...'
  ];

  useEffect(() => {
    let timer;
    if (loading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    if (!productId.trim() || !city.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const salesHistory = salesHistoryStr
      .split(',')
      .map((val) => parseFloat(val.trim()))
      .filter((val) => !isNaN(val));

    const payload = {
      product_id: productId.trim(),
      city: city.trim(),
      inventory: parseFloat(inventory) || 0,
      sales_history: salesHistory.length > 0 ? salesHistory : [100, 110, 120, 130]
    };

    try {
      const data = await predictDemand(payload);
      setResult(data);
    } catch (err) {
      console.error('Demand prediction error:', err);
      setError('Unable to generate demand forecast. Please verify backend service on port 8005.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate dynamic chart data based on user input and API prediction result
  const buildChartData = () => {
    if (!result) return { trendData: [], comparisonData: [] };

    const rawHistory = salesHistoryStr
      .split(',')
      .map((val) => parseFloat(val.trim()))
      .filter((val) => !isNaN(val));

    const sales = rawHistory.length > 0 ? rawHistory : [100, 110, 105, 120, 130];
    const predictedVal = result.predicted_demand || 135;

    // 1. Trend Data (Historical 5 points + 5-day Forecast Projection)
    const trendData = sales.map((val, idx) => ({
      name: `T-${sales.length - idx}`,
      actual: val,
      forecast: null
    }));

    // Add current point connecting history to forecast
    const lastActual = sales[sales.length - 1];
    trendData.push({
      name: 'Now',
      actual: lastActual,
      forecast: lastActual
    });

    // 5-day projected curve step-wise towards predicted demand
    const step = (predictedVal - lastActual) / 4;
    for (let i = 1; i <= 4; i++) {
      trendData.push({
        name: `Day +${i}`,
        actual: null,
        forecast: Math.round(lastActual + step * i)
      });
    }

    // 2. Comparison Data (Stock vs. Demand vs. Order Need)
    const comparisonData = [
      { name: 'Current Stock', amount: parseFloat(inventory) || 0, fill: '#3b82f6' },
      { name: 'Predicted Demand', amount: Math.round(predictedVal), fill: '#c084fc' },
      { name: 'Recommended Order', amount: Math.round(result.recommended_order || 0), fill: '#10b981' }
    ];

    return { trendData, comparisonData };
  };

  const { trendData, comparisonData } = buildChartData();

  return (
    <div className="demand-dashboard">
      {/* Intro Header Banner */}
      <div className="demand-intro-banner">
        <div className="banner-badge">
          <TrendingUp size={16} /> Demand Intelligence Engine
        </div>
        <h2>Demand Forecasting Dashboard</h2>
        <p>Predict future SKU demand by combining sales history, current stock, and live real-world event signals.</p>
      </div>

      {/* Centered Input Card */}
      <div className="card input-analysis-card">
        <form onSubmit={handlePredict} className="analysis-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="product-id-input">
                <Box size={16} /> Product SKU / ID
              </label>
              <input
                id="product-id-input"
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="e.g. PROD-101"
                className="custom-input"
              />
              <div className="example-chips">
                <span className="chips-label">Examples:</span>
                {productExamples.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-btn ${productId === item ? 'active' : ''}`}
                    onClick={() => setProductId(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="city-demand-input">
                <MapPin size={16} /> Location / Region
              </label>
              <input
                id="city-demand-input"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Delhi"
                className="custom-input"
              />
              <div className="example-chips">
                <span className="chips-label">Examples:</span>
                {cityExamples.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-btn ${city === item ? 'active' : ''}`}
                    onClick={() => setCity(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inventory-input">
                <Layers size={16} /> Current Stock Inventory (Units)
              </label>
              <input
                id="inventory-input"
                type="number"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                placeholder="150"
                className="custom-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sales-history-input">
                <Sliders size={16} /> Sales History Trend (comma separated)
              </label>
              <input
                id="sales-history-input"
                type="text"
                value={salesHistoryStr}
                onChange={(e) => setSalesHistoryStr(e.target.value)}
                placeholder="100, 110, 105, 120, 130"
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-action">
            <button
              type="submit"
              disabled={loading || !productId.trim() || !city.trim()}
              className="btn-primary analyze-btn"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" /> Forecasting...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Forecast Demand
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card loading-card">
          <div className="loading-content">
            <div className="spinner-wrapper">
              <div className="outer-ring" />
              <div className="inner-ring" />
              <TrendingUp size={28} className="center-icon spin" />
            </div>
            <div className="loading-messages">
              <h3>Generating Predictive Models</h3>
              <p className="loading-step-text">
                <span className="pulse-dot-active" /> {loadingMessages[loadingStep]}
              </p>
              <div className="loading-bar-track">
                <div
                  className="loading-bar-fill"
                  style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card error-card">
          <div className="error-icon-box">
            <AlertTriangle size={28} />
          </div>
          <div className="error-copy">
            <h3>Unable to forecast demand</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={handlePredict} className="btn-ghost retry-btn">
            <RefreshCw size={15} /> Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !result && (
        <div className="card empty-state-card">
          <div className="empty-icon-wrap">
            <Compass size={42} />
          </div>
          <h3>Ready for Demand Prediction</h3>
          <p>Enter product details, inventory level, and sales history to forecast demand.</p>
        </div>
      )}

      {/* Output Section with Dynamic Result Cards & Dynamic Recharts Graphs */}
      {!loading && result && (
        <div className="results-container animate-fade-in">
          {/* Top Metric Cards Row */}
          <div className="metric-row">
            <div className="metric-card shadow-glow-purple">
              <span className="metric-label">Predicted Demand</span>
              <span className="metric-value" style={{ color: '#c084fc' }}>
                {Math.round(result.predicted_demand || 0)} <small style={{ fontSize: '1rem', color: '#9aa3b2' }}>units</small>
              </span>
              <div className="metric-trend up">
                <TrendingUp size={14} /> Forecasted Need
              </div>
            </div>

            <div className="metric-card shadow-glow-cyan">
              <span className="metric-label">Confidence Score</span>
              <span className="metric-value" style={{ color: '#00f5ff' }}>
                {Math.round((result.confidence || 0.8) * 100)}%
              </span>
              <div className="metric-trend up">
                <ShieldCheck size={14} /> High Accuracy
              </div>
            </div>

            <div className="metric-card shadow-glow-emerald">
              <span className="metric-label">Recommended Order</span>
              <span className="metric-value" style={{ color: '#10b981' }}>
                {Math.round(result.recommended_order || 0)} <small style={{ fontSize: '1rem', color: '#9aa3b2' }}>units</small>
              </span>
              <div className="metric-trend up">
                <Box size={14} /> Replenishment Target
              </div>
            </div>

            <div className="metric-card shadow-glow-amber">
              <span className="metric-label">Inventory Status</span>
              <span className="metric-value" style={{ color: result.recommended_order > 0 ? '#f59e0b' : '#34d399' }}>
                {result.recommended_order > 0 ? 'REORDER' : 'HEALTHY'}
              </span>
              <div className="metric-trend up">
                <Zap size={14} /> Stock Assessment
              </div>
            </div>
          </div>

          {/* Dynamic Graphs Section */}
          <div className="grid" style={{ marginTop: '1.5rem' }}>
            {/* Chart 1: Dynamic Sales History & Demand Projection Area Chart */}
            <div className="card span-7 chart-card">
              <div className="card-title">
                <LineIcon size={20} color="#c084fc" /> Sales History vs. Forecast Trajectory
              </div>
              <p className="chart-subtitle">Historical sales trend seamlessly projected into future demand.</p>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f111a',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        color: '#f3f4f6'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Historical Sales"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#actualGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      name="Predicted Demand"
                      stroke="#c084fc"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#forecastGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Dynamic Stock vs. Demand Bar Comparison Chart */}
            <div className="card span-5 chart-card">
              <div className="card-title">
                <BarChart3 size={20} color="#00f5ff" /> Inventory & Order Need Balance
              </div>
              <p className="chart-subtitle">Direct metric comparison between stock, demand, and order need.</p>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f111a',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        color: '#f3f4f6'
                      }}
                    />
                    <Bar dataKey="amount" name="Units" radius={[8, 8, 0, 0]} fill="#00f5ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 3: Dynamic AI Reasons & Drivers */}
            <div className="card span-12 reasons-card">
              <div className="card-title">
                <Sparkles size={20} color="#34d399" /> AI Demand Drivers & Decision Factors
              </div>
              {result.reasons && result.reasons.length > 0 ? (
                <div className="reasons-list">
                  {result.reasons.map((reason, idx) => (
                    <div className="reason-item" key={idx}>
                      <div className="reason-icon-wrap">
                        <CheckCircle2 size={18} color="#34d399" />
                      </div>
                      <p className="reason-text">{reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">Demand model executed successfully with standard parameters.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled JSX Styles for Demand Dashboard */}
      <style>{`
        .demand-dashboard {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .demand-intro-banner {
          background: linear-gradient(135deg, rgba(192, 132, 252, 0.08) 0%, rgba(0, 245, 255, 0.04) 100%);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 1.5rem 1.8rem;
          backdrop-filter: blur(14px);
        }

        .demand-intro-banner h2 {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .demand-intro-banner p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        .chart-subtitle {
          font-size: 0.85rem;
          color: var(--text-tertiary);
          margin-bottom: 1rem;
        }

        .chart-wrapper {
          width: 100%;
          padding-top: 0.5rem;
        }

        .shadow-glow-purple {
          border-top: 3px solid #c084fc !important;
        }

        .shadow-glow-cyan {
          border-top: 3px solid #00f5ff !important;
        }

        .shadow-glow-emerald {
          border-top: 3px solid #10b981 !important;
        }

        .shadow-glow-amber {
          border-top: 3px solid #f59e0b !important;
        }

        .reasons-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .reason-item {
          display: flex;
          align-items: flex-start;
          gap: 0.8rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.9rem 1.1rem;
          transition: transform 0.15s, border-color 0.15s;
        }

        .reason-item:hover {
          transform: translateX(4px);
          border-color: rgba(52, 211, 153, 0.3);
        }

        .reason-icon-wrap {
          margin-top: 0.1rem;
          flex-shrink: 0;
        }

        .reason-text {
          font-size: 0.92rem;
          color: var(--text-primary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
