import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  RefreshCw,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  Newspaper,
  ExternalLink,
  BrainCircuit,
  AlertTriangle,
  MapPin,
  Box,
  Calendar,
  Zap,
  Gauge,
  Compass,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { getEventScore } from '../../api/agents.js';

export default function EventBody({ agent }) {
  const [product, setProduct] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const productExamples = ['Laptop', 'Rice', 'AC', 'Mobile'];
  const cityExamples = ['Chennai', 'Delhi', 'Mumbai'];

  const loadingMessages = [
    'Analyzing news articles & media feeds...',
    'Fetching real-time weather metrics...',
    'Generating AI insights...'
  ];

  useEffect(() => {
    let timer;
    if (loading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!product.trim() || !city.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getEventScore(product.trim(), city.trim());
      setResult(data);
    } catch (err) {
      console.error('Event analysis error:', err);
      setError('Unable to analyze events. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition = '') => {
    const cond = condition.toLowerCase();
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain size={28} className="weather-icon rain" />;
    if (cond.includes('cloud')) return <Cloud size={28} className="weather-icon cloud" />;
    if (cond.includes('clear') || cond.includes('sun')) return <Sun size={28} className="weather-icon sun" />;
    if (cond.includes('wind')) return <Wind size={28} className="weather-icon wind" />;
    return <Sun size={28} className="weather-icon default" />;
  };

  const getImpactColor = (score = 0) => {
    if (score >= 70) return '#f43f5e'; // High (Red/Rose)
    if (score >= 40) return '#f59e0b'; // Medium (Amber/Orange)
    return '#10b981'; // Low (Emerald/Green)
  };

  const getImpactBadgeClass = (impact = '') => {
    const imp = impact.toLowerCase();
    if (imp === 'high') return 'impact-high';
    if (imp === 'medium') return 'impact-medium';
    return 'impact-low';
  };

  return (
    <div className="event-dashboard">
      {/* Top Header Description */}
      <div className="event-intro-banner">
        <div className="banner-badge">
          <BrainCircuit size={16} /> Live Intelligence Engine
        </div>
        <h2>Event Intelligence Dashboard</h2>
        <p>Analyze real-world events affecting product demand using News, Weather, and Gemini AI.</p>
      </div>

      {/* Centered Input Card */}
      <div className="card input-analysis-card">
        <form onSubmit={handleAnalyze} className="analysis-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="product-input">
                <Box size={16} /> Product Name
              </label>
              <input
                id="product-input"
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Enter product name"
                className="custom-input"
              />
              <div className="example-chips">
                <span className="chips-label">Examples:</span>
                {productExamples.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-btn ${product === item ? 'active' : ''}`}
                    onClick={() => setProduct(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="city-input">
                <MapPin size={16} /> Location / City
              </label>
              <input
                id="city-input"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
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
          </div>

          <div className="form-action">
            <button
              type="submit"
              disabled={loading || !product.trim() || !city.trim()}
              className="btn-primary analyze-btn"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Analyze Event
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
              <BrainCircuit size={28} className="center-icon spin" />
            </div>
            <div className="loading-messages">
              <h3>Processing Real-Time Data Signals</h3>
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
            <h3>Unable to analyze events</h3>
            <p>{error}</p>
          </div>
          <button type="button" onClick={handleAnalyze} className="btn-ghost retry-btn">
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
          <h3>Ready for Signal Analysis</h3>
          <p>Enter a product and location to analyze how real-world events may impact demand.</p>
        </div>
      )}

      {/* Output Section */}
      {!loading && result && (
        <div className="results-container animate-fade-in">
          <div className="results-grid">
            {/* Card 1: Weather */}
            <div className="card weather-result-card">
              <div className="card-title">
                <Thermometer size={18} color="#00f5ff" /> Live Weather Conditions
              </div>
              {result.weather ? (
                <div className="weather-body">
                  <div className="weather-main-row">
                    <div className="weather-badge-icon">{getWeatherIcon(result.weather.condition)}</div>
                    <div className="weather-temp-block">
                      <span className="temp-value">{Math.round(result.weather.temperature)}°C</span>
                      <span className="temp-cond">{result.weather.condition}</span>
                    </div>
                  </div>
                  <div className="weather-desc-tag">"{result.weather.description || result.weather.condition}"</div>
                  <div className="weather-metrics-grid">
                    <div className="w-metric">
                      <span className="w-label">Feels Like</span>
                      <strong className="w-val">{Math.round(result.weather.feels_like)}°C</strong>
                    </div>
                    <div className="w-metric">
                      <span className="w-label">Humidity</span>
                      <strong className="w-val">{result.weather.humidity}%</strong>
                    </div>
                    <div className="w-metric">
                      <span className="w-label">Wind Speed</span>
                      <strong className="w-val">{result.weather.wind_speed} m/s</strong>
                    </div>
                    <div className="w-metric">
                      <span className="w-label">Pressure</span>
                      <strong className="w-val">{result.weather.pressure} hPa</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="no-data">Weather data unavailable</p>
              )}
            </div>

            {/* Card 3: Gemini AI Analysis */}
            <div className="card gemini-result-card span-8">
              <div className="card-title">
                <BrainCircuit size={20} color="#c084fc" /> Gemini AI Impact Analysis
              </div>
              {result.analysis ? (
                <div className="gemini-body">
                  <div className="summary-banner">
                    <p className="summary-text">"{result.analysis.summary}"</p>
                  </div>

                  <div className="meta-stats-row">
                    <div className="meta-stat-item">
                      <span className="meta-label">Category</span>
                      <span className="meta-badge category-badge">
                        <Zap size={14} /> {result.analysis.event_category || 'General'}
                      </span>
                    </div>

                    <div className="meta-stat-item">
                      <span className="meta-label">Demand Impact</span>
                      <span className={`meta-badge ${getImpactBadgeClass(result.analysis.demand_impact)}`}>
                        <TrendingUp size={14} /> {result.analysis.demand_impact || 'Moderate'}
                      </span>
                    </div>

                    <div className="meta-stat-item impact-score-block">
                      <span className="meta-label">Impact Score</span>
                      <div className="score-ring-wrap">
                        <svg className="score-ring" viewBox="0 0 36 36">
                          <path
                            className="ring-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="ring-fill"
                            stroke={getImpactColor(result.analysis.impact_score)}
                            strokeDasharray={`${result.analysis.impact_score || 50}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="ring-text" style={{ color: getImpactColor(result.analysis.impact_score) }}>
                          {result.analysis.impact_score ?? 50}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="reasoning-box">
                    <h4>
                      <ShieldAlert size={16} /> AI Impact Reasoning
                    </h4>
                    <p>{result.analysis.reasoning}</p>
                  </div>
                </div>
              ) : (
                <p className="no-data">AI analysis unavailable</p>
              )}
            </div>

            {/* Card 2: Latest News */}
            <div className="card news-result-card span-12">
              <div className="card-title">
                <Newspaper size={18} color="#34d399" /> Latest Real-World News Signals
              </div>
              {result.news && result.news.length > 0 ? (
                <div className="news-grid">
                  {result.news.slice(0, 4).map((item, index) => (
                    <div className="news-card-item" key={index}>
                      <div className="news-card-header">
                        <span className="news-source">{item.source || 'News Feed'}</span>
                        {item.publishedAt && (
                          <span className="news-date">
                            <Calendar size={12} /> {new Date(item.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4 className="news-title">{item.title}</h4>
                      <p className="news-desc">{item.description}</p>
                      {item.url && item.url !== '#' && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-read-more"
                        >
                          Read More <ArrowUpRight size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No recent news articles detected for this query.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled JSX Styles specifically for Event Dashboard */}
      <style>{`
        .event-dashboard {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .event-intro-banner {
          background: linear-gradient(135deg, rgba(0, 245, 255, 0.08) 0%, rgba(192, 132, 252, 0.04) 100%);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 1.5rem 1.8rem;
          backdrop-filter: blur(14px);
        }

        .banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(0, 245, 255, 0.12);
          color: var(--accent-blue);
          border-radius: 999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
        }

        .event-intro-banner h2 {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .event-intro-banner p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        .input-analysis-card {
          background: rgba(15, 17, 26, 0.75);
          border: 1px solid var(--border-strong);
          border-radius: 20px;
          padding: 1.8rem;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .custom-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .custom-input:focus {
          outline: none;
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.15);
        }

        .example-chips {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.3rem;
        }

        .chips-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .chip-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.76rem;
          padding: 0.2rem 0.6rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .chip-btn:hover, .chip-btn.active {
          background: rgba(0, 245, 255, 0.12);
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }

        .form-action {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .analyze-btn {
          padding: 0.75rem 2rem;
          font-size: 0.98rem;
          border-radius: 12px;
        }

        .loading-card {
          padding: 2.5rem 1.8rem;
          text-align: center;
          background: rgba(15, 17, 26, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.2);
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
        }

        .spinner-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
        }

        .outer-ring {
          position: absolute;
          inset: 0;
          border: 3px solid rgba(0, 245, 255, 0.15);
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 1.2s linear infinite;
        }

        .inner-ring {
          position: absolute;
          inset: 8px;
          border: 2px solid rgba(192, 132, 252, 0.15);
          border-bottom-color: var(--accent-purple);
          border-radius: 50%;
          animation: spin 0.8s linear reverse infinite;
        }

        .center-icon {
          color: var(--accent-blue);
        }

        .loading-messages h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
        }

        .loading-step-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .pulse-dot-active {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-blue);
          box-shadow: 0 0 10px var(--accent-blue);
          animation: pulse 1.5s infinite;
        }

        .loading-bar-track {
          width: 260px;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          margin: 0.8rem auto 0;
          overflow: hidden;
        }

        .loading-bar-fill {
          height: 100%;
          background: var(--grad-primary);
          transition: width 0.4s ease;
        }

        .error-card {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .error-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(244, 63, 94, 0.18);
          color: #f43f5e;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .error-copy h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fda4af;
        }

        .error-copy p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-top: 0.2rem;
        }

        .retry-btn {
          margin-left: auto;
        }

        .empty-state-card {
          text-align: center;
          padding: 3.5rem 2rem;
          background: rgba(15, 17, 26, 0.5);
          border: 1px dashed var(--border-strong);
        }

        .empty-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: rgba(0, 245, 255, 0.08);
          color: var(--accent-blue);
          display: grid;
          place-items: center;
          margin: 0 auto 1.2rem;
        }

        .empty-state-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .empty-state-card p {
          color: var(--text-secondary);
          font-size: 0.92rem;
          max-width: 45ch;
          margin: 0.4rem auto 0;
        }

        .results-container {
          width: 100%;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
        }

        .weather-result-card {
          grid-column: span 4;
        }

        .gemini-result-card {
          grid-column: span 8;
        }

        .news-result-card {
          grid-column: span 12;
        }

        .weather-main-row {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin-bottom: 0.6rem;
        }

        .weather-badge-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(0, 245, 255, 0.12);
          display: grid;
          place-items: center;
        }

        .weather-icon.rain { color: #38bdf8; }
        .weather-icon.cloud { color: #94a3b8; }
        .weather-icon.sun { color: #fbbf24; }
        .weather-icon.wind { color: #c084fc; }
        .weather-icon.default { color: #00f5ff; }

        .weather-temp-block {
          display: flex;
          flex-direction: column;
        }

        .temp-value {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .temp-cond {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--accent-blue);
          margin-top: 0.2rem;
        }

        .weather-desc-tag {
          font-size: 0.85rem;
          font-style: italic;
          color: var(--text-tertiary);
          margin-bottom: 1.2rem;
          text-transform: capitalize;
        }

        .weather-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8rem;
        }

        .w-metric {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          display: flex;
          flex-direction: column;
        }

        .w-label {
          font-size: 0.72rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .w-val {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 0.1rem;
        }

        .gemini-body {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .summary-banner {
          background: linear-gradient(135deg, rgba(192, 132, 252, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%);
          border-left: 4px solid var(--accent-purple);
          border-radius: 0 12px 12px 0;
          padding: 1rem 1.25rem;
        }

        .summary-text {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.5;
          color: #f3e8ff;
        }

        .meta-stats-row {
          display: grid;
          grid-template-columns: 1.2fr 1.2fr 1fr;
          gap: 1rem;
          align-items: center;
        }

        .meta-stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .meta-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          font-weight: 700;
        }

        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .category-badge {
          background: rgba(0, 245, 255, 0.12);
          color: var(--accent-blue);
          border: 1px solid rgba(0, 245, 255, 0.3);
        }

        .impact-high {
          background: rgba(244, 63, 94, 0.15);
          color: #fda4af;
          border: 1px solid rgba(244, 63, 94, 0.35);
        }

        .impact-medium {
          background: rgba(245, 158, 11, 0.15);
          color: #fde047;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .impact-low {
          background: rgba(16, 185, 129, 0.15);
          color: #6ee7b7;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .impact-score-block {
          align-items: flex-start;
        }

        .score-ring-wrap {
          position: relative;
          width: 52px;
          height: 52px;
        }

        .score-ring {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .ring-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.08);
          stroke-width: 3.5;
        }

        .ring-fill {
          fill: none;
          stroke-width: 3.5;
          stroke-linecap: round;
          transition: stroke-dasharray 0.8s ease;
        }

        .ring-text {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .reasoning-box {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.1rem 1.25rem;
        }

        .reasoning-box h4 {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--accent-purple);
          margin-bottom: 0.5rem;
        }

        .reasoning-box p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .news-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.2rem;
        }

        .news-card-item {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          transition: transform 0.2s, border-color 0.2s;
        }

        .news-card-item:hover {
          transform: translateY(-2px);
          border-color: var(--border-strong);
        }

        .news-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.76rem;
        }

        .news-source {
          font-weight: 700;
          color: #34d399;
          background: rgba(52, 211, 153, 0.12);
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
        }

        .news-date {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: var(--text-tertiary);
        }

        .news-title {
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.35;
          color: var(--text-primary);
        }

        .news-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-read-more {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--accent-blue);
          margin-top: auto;
          padding-top: 0.4rem;
          transition: gap 0.15s;
        }

        .news-read-more:hover {
          gap: 0.5rem;
        }

        .no-data {
          font-size: 0.9rem;
          color: var(--text-tertiary);
          font-style: italic;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .form-grid { grid-template-columns: 1fr; }
          .weather-result-card, .gemini-result-card { grid-column: span 12; }
          .news-grid { grid-template-columns: 1fr; }
          .meta-stats-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
