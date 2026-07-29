import React, { useEffect, useState } from 'react';
import { Boxes, Warehouse, AlertTriangle, RefreshCw, Calculator, Plus, CheckCircle2 } from 'lucide-react';

function pct(onHand, threshold) {
  if (!threshold || threshold === 0) return 100;
  return Math.min(100, Math.round((onHand / (threshold * 2)) * 100));
}

function statusColor(status) {
  const s = (status || '').toUpperCase();
  if (s === 'LOW' || s === 'CRITICAL' || s === 'LOW STOCK') return '#f43f5e';
  if (s === 'MEDIUM' || s === 'OVERSTOCK') return '#f59e0b';
  return '#10b981';
}

const FALLBACK_STOCK = [
  { product_name: 'Silicon Sensors', current_stock: 45, reorder_point: 100, safety_stock: 62.5, eoq: 250, status: 'LOW' },
  { product_name: 'Raw Steel Coils', current_stock: 320, reorder_point: 150, safety_stock: 175, eoq: 500, status: 'OK' },
  { product_name: 'Micro-controllers', current_stock: 88, reorder_point: 120, safety_stock: 120, eoq: 300, status: 'LOW' },
  { product_name: 'Packaging Film', current_stock: 1200, reorder_point: 400, safety_stock: 200, eoq: 800, status: 'OK' },
  { product_name: 'Fasteners M8', current_stock: 640, reorder_point: 300, safety_stock: 120, eoq: 600, status: 'OK' },
];

export default function InventoryBody({ agent }) {
  const [stock, setStock] = useState(FALLBACK_STOCK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Form inputs for calculation
  const [showAddForm, setShowAddForm] = useState(false);
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
        setMsg('Successfully recalculated EOQ, Safety Stock & ROP!');
        setTimeout(() => setMsg(null), 3000);
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

  const criticalItems = stock.filter(
    (s) => s.current_stock < (s.reorder_point || s.safety_stock || 0)
  );
  const avgRunway = stock.length
    ? (stock.reduce((acc, s) => {
        const usage = Math.max(1, s.average_daily_usage || (s.reorder_point || 100) / 5);
        return acc + s.current_stock / usage;
      }, 0) / stock.length).toFixed(1)
    : '–';
  const fillRate = stock.length
    ? Math.round(
        (stock.filter((s) => s.current_stock >= (s.reorder_point || 0)).length / stock.length) * 100
      )
    : 96;

  const runways = [
    { label: 'Avg Runway', value: avgRunway, unit: 'days', ring: Math.min(100, parseFloat(avgRunway) * 5) },
    { label: 'Critical SKUs', value: criticalItems.length, unit: 'items', ring: Math.min(100, criticalItems.length * 15) },
    { label: 'Fill Rate', value: fillRate, unit: '%', ring: fillRate },
  ];

  return (
    <>
      {/* KPI Gauges */}
      <div className="gauge-row">
        {runways.map((g) => (
          <div className="card gauge-card" key={g.label}>
            <div className="gauge" style={{ '--accent': agent.accent, '--val': g.ring }}>
              <span>{g.value}<small>{g.unit}</small></span>
            </div>
            <p>{g.label}</p>
          </div>
        ))}
      </div>

      {/* Action Controls & Notifications */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6b7280' }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Processing calculation & database sync…
            </span>
          ) : (
            <>
              <span style={{ color: error ? '#f59e0b' : '#10b981' }}>
                {error ? '⚠ ' + error : `✓ Neon DB Synced · Updated ${lastUpdated}`}
              </span>
              <button
                onClick={fetchInventory}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, fontSize: 12 }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </>
          )}
          {msg && (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, background: '#10b98115', padding: '2px 8px', borderRadius: 4 }}>
              <CheckCircle2 size={13} /> {msg}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleRecalculate}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, background: '#3b82f6', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Calculator size={13} /> Recalculate EOQ & ROP
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, background: agent.accent, border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={13} /> {showAddForm ? 'Close Form' : 'Add New Material'}
          </button>
        </div>
      </div>

      {/* Add New Material Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: 16, border: `1px solid ${agent.accent}44`, background: '#111827' }}>
          <div className="card-title"><Calculator size={16} color={agent.accent} /> Add New Material & Calculate Metrics</div>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Material / SKU Name</label>
              <input
                type="text"
                placeholder="e.g. Copper Wire 2mm"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Current Stock (Units)</label>
              <input
                type="number"
                placeholder="e.g. 150"
                value={currStock}
                onChange={(e) => setCurrStock(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Daily Usage (Units/day)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 15.0"
                value={dailyUsage}
                onChange={(e) => setDailyUsage(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Supplier Lead Time (Days)</label>
              <input
                type="number"
                placeholder="e.g. 7"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#f3f4f6', fontSize: 12 }}
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ width: '100%', padding: '7px 14px', background: agent.accent, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 12, cursor: 'pointer' }}
              >
                {saving ? 'Calculating & Saving…' : 'Calculate & Save to DB'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Stock Levels & Calculation Breakdown */}
      <div className="grid">
        <div className="card span-8">
          <div className="card-title"><Boxes size={18} color={agent.accent} /> Stock Levels & Dynamic Calculations (ROP / Safety / EOQ)</div>
          <div className="stock-list">
            {stock.map((s) => {
              const threshold = s.reorder_point || s.safety_stock || 100;
              const low = s.current_stock < threshold;
              const barColor = low ? '#f43f5e' : statusColor(s.status) === '#f43f5e' ? '#f59e0b' : agent.accent;
              return (
                <div className="stock-row" key={s.product_name || s.id} style={{ padding: '8px 0', borderBottom: '1px solid #1f2937' }}>
                  <div style={{ flex: 1 }}>
                    <div className="stock-name" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {low && <AlertTriangle size={14} className="stock-warn" />}
                      {s.product_name}
                      <span style={{ fontSize: 10, background: `${statusColor(s.status)}22`, color: statusColor(s.status), padding: '1px 6px', borderRadius: 4 }}>
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                      ROP: <strong style={{ color: '#e5e7eb' }}>{s.reorder_point || 0}</strong> | Safety Stock: <strong style={{ color: '#e5e7eb' }}>{s.safety_stock || 0}</strong> | EOQ: <strong style={{ color: '#10b981' }}>{s.eoq || 0}</strong> units
                    </div>
                  </div>

                  <div className="stock-track" style={{ width: 140 }}>
                    <span className="stock-thresh" style={{ left: `${pct(threshold, threshold)}%` }} />
                    <span
                      className="stock-fill"
                      style={{ width: `${pct(s.current_stock, threshold)}%`, background: barColor }}
                    />
                  </div>
                  <div className="stock-num" style={{ textAlign: 'right', minWidth: 80 }}>
                    {s.current_stock?.toLocaleString()} <small>units</small>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="legend"><span className="legend-thresh" /> reorder threshold (ROP)</p>
        </div>

        {/* Warehouse Fill & Summary */}
        <div className="card span-4">
          <div className="card-title"><Warehouse size={18} color={agent.accent} /> Warehouse Metrics</div>
          <div className="wh-list">
            <div className="wh-item">
              <div className="wh-top"><b>WH-1</b><span>Central Stock</span><em>82%</em></div>
              <div className="wh-bar"><span style={{ width: '82%', background: agent.accent }} /></div>
            </div>
            <div className="wh-item">
              <div className="wh-top"><b>WH-2</b><span>North Dock</span><em>61%</em></div>
              <div className="wh-bar"><span style={{ width: '61%', background: agent.accent }} /></div>
            </div>
            <div className="wh-item">
              <div className="wh-top"><b>WH-3</b><span>Overflow</span><em>34%</em></div>
              <div className="wh-bar"><span style={{ width: '34%', background: agent.accent }} /></div>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1f2937', fontSize: 11, color: '#9ca3af' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Total Materials Tracked</span><strong style={{ color: '#f3f4f6' }}>{stock.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Reorder Triggered (Low)</span>
              <strong style={{ color: '#f43f5e' }}>{criticalItems.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Avg Recommended EOQ</span>
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
