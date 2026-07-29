import React, { useEffect, useState } from 'react';
import { Boxes, Warehouse, AlertTriangle, RefreshCw, Calculator, Plus, CheckCircle2, Search, Info, ShieldAlert, MapPin } from 'lucide-react';

function pct(onHand, threshold) {
  if (!threshold || threshold === 0) return 100;
  return Math.min(100, Math.round((onHand / (threshold * 2)) * 100));
}

function statusColor(status) {
  const s = (status || '').toUpperCase();
  if (s.includes('CRITICAL')) return '#f43f5e';
  if (s.includes('LOW')) return '#f59e0b';
  if (s.includes('OVERSTOCK')) return '#3b82f6';
  return '#10b981';
}

export default function InventoryBody({ agent }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [prodName, setProdName] = useState('');
  const [currStock, setCurrStock] = useState('');
  const [dailyUsage, setDailyUsage] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inventory/inventory/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setStock(data);
      }
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    } catch (err) {
      setError(`Backend offline — showing cached data. (${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/inventory/recalculate', { method: 'POST' });
      if (res.ok) {
        setMsg('Recalculated EOQ, Safety Stock & ROP across all SKUs!');
        setTimeout(() => setMsg(null), 3500);
        await fetchInventory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!prodName || !currStock || !dailyUsage || !leadTime) return;
    setSaving(true);
    try {
      const payload = {
        product_name: prodName,
        current_stock: parseInt(currStock),
        average_daily_usage: parseFloat(dailyUsage),
        lead_time: parseInt(leadTime)
      };
      const res = await fetch('/api/inventory/inventory/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMsg(`Added '${prodName}' & saved calculation to DB!`);
        setProdName('');
        setCurrStock('');
        setDailyUsage('');
        setLeadTime('');
        setShowAddForm(false);
        setTimeout(() => setMsg(null), 4000);
        await fetchInventory();
      }
    } catch (err) {
      setError(`Failed to save calculation: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filter & Search logic
  const filteredStock = stock.filter((s) => {
    const matchesSearch = (s.product_name || '').toLowerCase().includes(search.toLowerCase());
    const st = (s.status || '').toUpperCase();
    if (filterTab === 'CRITICAL') return matchesSearch && st.includes('CRITICAL');
    if (filterTab === 'LOW') return matchesSearch && (st.includes('LOW') || st.includes('CRITICAL'));
    if (filterTab === 'HEALTHY') return matchesSearch && (st.includes('OK') || st.includes('HEALTHY') || st.includes('IN_STOCK'));
    if (filterTab === 'OVERSTOCK') return matchesSearch && st.includes('OVERSTOCK');
    return matchesSearch;
  });

  const criticalCount = stock.filter((s) => (s.status || '').toUpperCase().includes('CRITICAL')).length;
  const lowCount = stock.filter((s) => (s.status || '').toUpperCase().includes('LOW')).length;
  const healthyCount = stock.filter((s) => (s.status || '').toUpperCase().includes('OK') || (s.status || '').toUpperCase().includes('HEALTHY')).length;

  const avgRunway = stock.length
    ? (stock.reduce((acc, s) => {
        const usage = Math.max(0.1, s.average_daily_usage || (s.reorder_point || 100) / 5);
        return acc + s.current_stock / usage;
      }, 0) / stock.length).toFixed(1)
    : '–';

  const fillRate = stock.length
    ? Math.round((stock.filter((s) => s.current_stock >= (s.reorder_point || 0)).length / stock.length) * 100)
    : 95;

  return (
    <div style={{ fontSize: 14 }}>
      {/* Top Prominent KPI Gauges */}
      <div className="gauge-row" style={{ gap: 16, marginBottom: 20 }}>
        <div className="card gauge-card" style={{ padding: 20 }}>
          <div className="gauge" style={{ '--accent': agent.accent, '--val': Math.min(100, parseFloat(avgRunway) * 4), width: 90, height: 90 }}>
            <span style={{ fontSize: 20 }}>{avgRunway}<small style={{ fontSize: 11 }}>days</small></span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>Avg Stock Runway</p>
        </div>
        <div className="card gauge-card" style={{ padding: 20 }}>
          <div className="gauge" style={{ '--accent': '#f43f5e', '--val': Math.min(100, criticalCount * 20), width: 90, height: 90 }}>
            <span style={{ fontSize: 20 }}>{criticalCount}<small style={{ fontSize: 11 }}>SKUs</small></span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>Critical Reorder Alerts</p>
        </div>
        <div className="card gauge-card" style={{ padding: 20 }}>
          <div className="gauge" style={{ '--accent': '#10b981', '--val': fillRate, width: 90, height: 90 }}>
            <span style={{ fontSize: 20 }}>{fillRate}<small style={{ fontSize: 11 }}>%</small></span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>Inventory Fill Rate</p>
        </div>
      </div>

      {/* Action Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13 }}>
          <span style={{ color: error ? '#f59e0b' : '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {error ? '⚠ ' + error : `🇮🇳 Neon Cloud Synced · ${stock.length} Live Indian Manufacturing SKUs (${lastUpdated || 'Active'})`}
          </span>
          <button onClick={fetchInventory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            style={{ padding: '8px 14px', fontSize: 13, background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
          >
            <Info size={15} color="#3b82f6" /> {showFormulaInfo ? 'Hide Formulas' : 'View Math Logic'}
          </button>
          <button
            onClick={handleRecalculate}
            style={{ padding: '8px 14px', fontSize: 13, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
          >
            <Calculator size={15} /> Recalculate EOQ & ROP
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '8px 16px', fontSize: 13, background: agent.accent, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}
          >
            <Plus size={15} /> {showAddForm ? 'Close Form' : '+ Add New Material'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 14, padding: '10px 16px', background: '#10b98115', border: '1px solid #10b98144', color: '#10b981', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      {/* Formula Info Card */}
      {showFormulaInfo && (
        <div className="card" style={{ marginBottom: 18, background: '#0f172a', border: '1px solid #3b82f644', padding: 18 }}>
          <div className="card-title" style={{ color: '#60a5fa', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} /> Inventory Mathematical Formulas & Optimization Equations
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>1. Economic Order Quantity (EOQ)</strong>
              <code style={{ background: '#0f172a', padding: '4px 8px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 6, fontSize: 13 }}>
                EOQ = √((2 × Demand × SetupCost) / HoldingCost)
              </code>
              <p style={{ margin: 0, fontSize: 12 }}>Calculates optimal purchasing batch size to minimize holding and setup costs.</p>
            </div>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>2. Reorder Point (ROP)</strong>
              <code style={{ background: '#0f172a', padding: '4px 8px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 6, fontSize: 13 }}>
                ROP = (Daily Usage × Lead Time) + Safety Stock
              </code>
              <p style={{ margin: 0, fontSize: 12 }}>Threshold that automatically triggers purchase orders before stockout occurs.</p>
            </div>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>3. Safety Stock Buffer</strong>
              <code style={{ background: '#0f172a', padding: '4px 8px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 6, fontSize: 13 }}>
                Safety Stock = Daily Usage × Lead Time
              </code>
              <p style={{ margin: 0, fontSize: 12 }}>Buffer stock that protects production assembly against supply chain delays.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Material Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: 18, border: `1px solid ${agent.accent}66`, background: '#111827', padding: 18 }}>
          <div className="card-title" style={{ fontSize: 16, marginBottom: 12 }}><Calculator size={18} color={agent.accent} /> Add New Material & Calculate Metrics</div>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6, fontWeight: 500 }}>Material / SKU Name</label>
              <input type="text" placeholder="e.g. Jindal Stainless Sheet 2mm" value={prodName} onChange={(e) => setProdName(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#f3f4f6', fontSize: 13, height: 42 }} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6, fontWeight: 500 }}>Current Stock (Units)</label>
              <input type="number" placeholder="e.g. 500" value={currStock} onChange={(e) => setCurrStock(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#f3f4f6', fontSize: 13, height: 42 }} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6, fontWeight: 500 }}>Daily Usage (Units/day)</label>
              <input type="number" step="0.1" placeholder="e.g. 25.0" value={dailyUsage} onChange={(e) => setDailyUsage(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#f3f4f6', fontSize: 13, height: 42 }} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6, fontWeight: 500 }}>Supplier Lead Time (Days)</label>
              <input type="number" placeholder="e.g. 5" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#f3f4f6', fontSize: 13, height: 42 }} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ width: '100%', height: 42, background: agent.accent, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
                {saving ? 'Calculating & Saving…' : 'Calculate & Save to DB'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Stock Table */}
      <div className="grid" style={{ gap: 16 }}>
        <div className="card span-8" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title" style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Boxes size={20} color={agent.accent} /> Live Indian Inventory Materials ({filteredStock.length})
            </div>

            {/* Search and Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Search material SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '7px 12px 7px 32px', background: '#111827', border: '1px solid #374151', borderRadius: 6, color: '#fff', fontSize: 13, width: 200, height: 36 }}
                />
              </div>

              <div style={{ display: 'flex', background: '#111827', padding: 3, borderRadius: 6, border: '1px solid #374151' }}>
                {['ALL', 'CRITICAL', 'LOW', 'HEALTHY'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    style={{
                      background: filterTab === tab ? agent.accent : 'transparent',
                      color: filterTab === tab ? '#fff' : '#9ca3af',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {tab} {tab === 'CRITICAL' ? `(${criticalCount})` : tab === 'LOW' ? `(${lowCount})` : tab === 'HEALTHY' ? `(${healthyCount})` : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="stock-list" style={{ maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
            {filteredStock.map((s) => {
              const threshold = s.reorder_point || s.safety_stock || 100;
              const isLow = s.current_stock < threshold;
              const color = statusColor(s.status);
              return (
                <div className="stock-row" key={s.id || s.product_name} style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', background: '#111827', borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="stock-name" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: '#f3f4f6' }}>
                      {isLow && <ShieldAlert size={16} color="#f43f5e" />}
                      {s.product_name}
                      <span style={{ fontSize: 11, background: `${color}22`, color: color, padding: '2px 8px', borderRadius: 4, border: `1px solid ${color}44`, fontWeight: 600 }}>
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, display: 'flex', gap: 14 }}>
                      <span>Reorder ROP: <strong style={{ color: '#f3f4f6' }}>{s.reorder_point || 0}</strong></span>
                      <span>Safety Stock: <strong style={{ color: '#f3f4f6' }}>{s.safety_stock || 0}</strong></span>
                      <span>Optimal EOQ: <strong style={{ color: '#10b981' }}>{s.eoq || 0}</strong> units</span>
                    </div>
                  </div>

                  <div className="stock-track" style={{ width: 150, height: 10, background: '#1f2937', borderRadius: 5 }}>
                    <span className="stock-thresh" style={{ left: `${pct(threshold, threshold)}%`, height: 14, top: -2 }} />
                    <span className="stock-fill" style={{ width: `${pct(s.current_stock, threshold)}%`, background: color, borderRadius: 5 }} />
                  </div>

                  <div className="stock-num" style={{ textAlign: 'right', minWidth: 100, fontWeight: 'bold', fontSize: 16, color: isLow ? '#f43f5e' : '#f3f4f6' }}>
                    {s.current_stock?.toLocaleString()} <small style={{ fontWeight: 'normal', color: '#9ca3af', fontSize: 12 }}>units</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Metrics */}
        <div className="card span-4" style={{ padding: 20 }}>
          <div className="card-title" style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}><Warehouse size={20} color={agent.accent} /> Indian Hub Telemetry</div>
          <div className="wh-list" style={{ gap: 14 }}>
            <div className="wh-item">
              <div className="wh-top" style={{ fontSize: 13 }}><b>WH-1 (Jamshedpur)</b><span>Steel & Metal Hub</span><em>86%</em></div>
              <div className="wh-bar" style={{ height: 8 }}><span style={{ width: '86%', background: agent.accent }} /></div>
            </div>
            <div className="wh-item">
              <div className="wh-top" style={{ fontSize: 13 }}><b>WH-2 (Pune)</b><span>Auto Component Hub</span><em>68%</em></div>
              <div className="wh-bar" style={{ height: 8 }}><span style={{ width: '68%', background: agent.accent }} /></div>
            </div>
            <div className="wh-item">
              <div className="wh-top" style={{ fontSize: 13 }}><b>WH-3 (Bengaluru)</b><span>Electronics & Sensors</span><em>52%</em></div>
              <div className="wh-bar" style={{ height: 8 }}><span style={{ width: '52%', background: agent.accent }} /></div>
            </div>
            <div className="wh-item">
              <div className="wh-top" style={{ fontSize: 13 }}><b>WH-4 (Hazira)</b><span>Polymers & Petrochem</span><em>74%</em></div>
              <div className="wh-bar" style={{ height: 8 }}><span style={{ width: '74%', background: agent.accent }} /></div>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #1f2937', fontSize: 13, color: '#9ca3af' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Total Neon DB SKUs</span><strong style={{ color: '#f3f4f6' }}>{stock.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Reorder Triggers (Critical)</span><strong style={{ color: '#f43f5e' }}>{criticalCount + lowCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Average Daily Usage</span>
              <strong style={{ color: '#38bdf8' }}>
                {stock.length ? (stock.reduce((a, b) => a + (b.average_daily_usage || 0), 0) / stock.length).toFixed(1) : 0} units/day
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Average Recommended EOQ</span>
              <strong style={{ color: '#10b981' }}>
                {stock.length ? Math.round(stock.reduce((a, b) => a + (b.eoq || 0), 0) / stock.length) : 0} units
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
