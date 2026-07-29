import React, { useEffect, useState } from 'react';
import { Boxes, Warehouse, AlertTriangle, RefreshCw, Calculator, Plus, CheckCircle2, Search, Info, TrendingUp, ShieldAlert } from 'lucide-react';

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

  // Form states
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
        setMsg('Successfully recalculated EOQ, Safety Stock & ROP across all SKUs!');
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
        setMsg(`Added '${prodName}' & saved calculation to Neon DB!`);
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
    <>
      {/* Top Gauges */}
      <div className="gauge-row">
        <div className="card gauge-card">
          <div className="gauge" style={{ '--accent': agent.accent, '--val': Math.min(100, parseFloat(avgRunway) * 4) }}>
            <span>{avgRunway}<small>days</small></span>
          </div>
          <p>Avg Stock Runway</p>
        </div>
        <div className="card gauge-card">
          <div className="gauge" style={{ '--accent': '#f43f5e', '--val': Math.min(100, criticalCount * 20) }}>
            <span>{criticalCount}<small>SKUs</small></span>
          </div>
          <p>Critical Reorder Alert</p>
        </div>
        <div className="card gauge-card">
          <div className="gauge" style={{ '--accent': '#10b981', '--val': fillRate }}>
            <span>{fillRate}<small>%</small></span>
          </div>
          <p>Inventory Fill Rate</p>
        </div>
      </div>

      {/* Action Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <span style={{ color: error ? '#f59e0b' : '#10b981', fontWeight: 500 }}>
            {error ? '⚠ ' + error : `✓ Neon Cloud Synced · ${stock.length} Live Database SKUs (${lastUpdated || 'Active'})`}
          </span>
          <button onClick={fetchInventory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            style={{ padding: '6px 12px', fontSize: 12, background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Info size={13} color="#3b82f6" /> {showFormulaInfo ? 'Hide Formulas' : 'View Formulas & Math'}
          </button>
          <button
            onClick={handleRecalculate}
            style={{ padding: '6px 12px', fontSize: 12, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Calculator size={13} /> Recalculate EOQ & ROP
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '6px 12px', fontSize: 12, background: agent.accent, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}
          >
            <Plus size={13} /> {showAddForm ? 'Close Form' : 'Add New Material'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#10b98115', border: '1px solid #10b98144', color: '#10b981', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={15} /> {msg}
        </div>
      )}

      {/* Mathematical Calculation Formula Card */}
      {showFormulaInfo && (
        <div className="card" style={{ marginBottom: 14, background: '#0f172a', border: '1px solid #3b82f644' }}>
          <div className="card-title" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calculator size={16} /> Inventory Calculation Logic & Mathematical Formulas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 6 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>1. Economic Order Quantity (EOQ)</strong>
              <code style={{ background: '#0f172a', padding: '3px 6px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 4 }}>
                EOQ = √((2 × Demand × SetupCost) / HoldingCost)
              </code>
              <p style={{ margin: 0, fontSize: 11 }}>Calculates optimal order batch size to minimize total holding and ordering costs.</p>
            </div>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 6 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>2. Reorder Point (ROP)</strong>
              <code style={{ background: '#0f172a', padding: '3px 6px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 4 }}>
                ROP = (Daily Usage × Lead Time) + Safety Stock
              </code>
              <p style={{ margin: 0, fontSize: 11 }}>Defines minimum stock level that automatically triggers a new purchase order.</p>
            </div>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 6 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>3. Safety Stock Buffer</strong>
              <code style={{ background: '#0f172a', padding: '3px 6px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 4 }}>
                Safety Stock = Daily Usage × Lead Time
              </code>
              <p style={{ margin: 0, fontSize: 11 }}>Protects manufacturing assembly line against unexpected supply chain delays.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Material Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: 14, border: `1px solid ${agent.accent}44`, background: '#111827' }}>
          <div className="card-title"><Calculator size={16} color={agent.accent} /> Add New Material & Compute Real-Time Metrics</div>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Material / SKU Name</label>
              <input type="text" placeholder="e.g. Copper Rod 10mm" value={prodName} onChange={(e) => setProdName(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }} required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Current Stock (Units)</label>
              <input type="number" placeholder="e.g. 200" value={currStock} onChange={(e) => setCurrStock(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }} required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Daily Usage (Units/day)</label>
              <input type="number" step="0.1" placeholder="e.g. 15.0" value={dailyUsage} onChange={(e) => setDailyUsage(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }} required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Supplier Lead Time (Days)</label>
              <input type="number" placeholder="e.g. 6" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: '7px 14px', background: agent.accent, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 12, cursor: 'pointer' }}>
                {saving ? 'Calculating & Saving…' : 'Calculate & Save to DB'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Stock List Card */}
      <div className="grid">
        <div className="card span-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>
              <Boxes size={18} color={agent.accent} /> Live Database Stock Items ({filteredStock.length})
            </div>

            {/* Search and Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Search SKU material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '4px 8px 4px 26px', background: '#111827', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11, width: 160 }}
                />
              </div>

              <div style={{ display: 'flex', background: '#111827', padding: 2, borderRadius: 4, border: '1px solid #374151' }}>
                {['ALL', 'CRITICAL', 'LOW', 'HEALTHY'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    style={{
                      background: filterTab === tab ? agent.accent : 'transparent',
                      color: filterTab === tab ? '#fff' : '#9ca3af',
                      border: 'none',
                      padding: '2px 8px',
                      borderRadius: 3,
                      fontSize: 10,
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

          <div className="stock-list" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {filteredStock.map((s) => {
              const threshold = s.reorder_point || s.safety_stock || 100;
              const isLow = s.current_stock < threshold;
              const color = statusColor(s.status);
              return (
                <div className="stock-row" key={s.id || s.product_name} style={{ padding: '8px 0', borderBottom: '1px solid #1f2937' }}>
                  <div style={{ flex: 1 }}>
                    <div className="stock-name" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      {isLow && <ShieldAlert size={14} color="#f43f5e" />}
                      {s.product_name}
                      <span style={{ fontSize: 10, background: `${color}22`, color: color, padding: '1px 6px', borderRadius: 4, border: `1px solid ${color}44` }}>
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                      ROP: <strong style={{ color: '#f3f4f6' }}>{s.reorder_point || 0}</strong> | Safety Stock: <strong style={{ color: '#f3f4f6' }}>{s.safety_stock || 0}</strong> | EOQ: <strong style={{ color: '#10b981' }}>{s.eoq || 0}</strong> units
                    </div>
                  </div>

                  <div className="stock-track" style={{ width: 130 }}>
                    <span className="stock-thresh" style={{ left: `${pct(threshold, threshold)}%` }} />
                    <span className="stock-fill" style={{ width: `${pct(s.current_stock, threshold)}%`, background: color }} />
                  </div>

                  <div className="stock-num" style={{ textAlign: 'right', minWidth: 80, fontWeight: 'bold', color: isLow ? '#f43f5e' : '#f3f4f6' }}>
                    {s.current_stock?.toLocaleString()} <small style={{ fontWeight: 'normal', color: '#9ca3af' }}>units</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Fill & Summary */}
        <div className="card span-4">
          <div className="card-title"><Warehouse size={18} color={agent.accent} /> Warehouse Telemetry & Metrics</div>
          <div className="wh-list">
            <div className="wh-item">
              <div className="wh-top"><b>WH-1</b><span>Central Assembly</span><em>84%</em></div>
              <div className="wh-bar"><span style={{ width: '84%', background: agent.accent }} /></div>
            </div>
            <div className="wh-item">
              <div className="wh-top"><b>WH-2</b><span>North Logistics</span><em>62%</em></div>
              <div className="wh-bar"><span style={{ width: '62%', background: agent.accent }} /></div>
            </div>
            <div className="wh-item">
              <div className="wh-top"><b>WH-3</b><span>Raw Materials Buffer</span><em>45%</em></div>
              <div className="wh-bar"><span style={{ width: '45%', background: agent.accent }} /></div>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1f2937', fontSize: 11, color: '#9ca3af' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Total Neon DB SKUs</span><strong style={{ color: '#f3f4f6' }}>{stock.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Reorder Point Triggered</span><strong style={{ color: '#f43f5e' }}>{criticalCount + lowCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Average Daily Usage</span>
              <strong style={{ color: '#38bdf8' }}>
                {stock.length ? (stock.reduce((a, b) => a + (b.average_daily_usage || 0), 0) / stock.length).toFixed(1) : 0} units/day
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Average EOQ Batch</span>
              <strong style={{ color: '#10b981' }}>
                {stock.length ? Math.round(stock.reduce((a, b) => a + (b.eoq || 0), 0) / stock.length) : 0} units
              </strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
