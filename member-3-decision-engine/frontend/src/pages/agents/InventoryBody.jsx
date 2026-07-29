import React, { useEffect, useState } from 'react';
import { Boxes, Warehouse, AlertTriangle, RefreshCw } from 'lucide-react';

/* ── helpers ─────────────────────────────────────────── */
function pct(onHand, threshold) {
  if (!threshold || threshold === 0) return 100;
  return Math.min(100, Math.round((onHand / (threshold * 2)) * 100));
}

function statusColor(status) {
  const s = (status || '').toUpperCase();
  if (s === 'LOW' || s === 'CRITICAL') return '#f43f5e';
  if (s === 'MEDIUM') return '#f59e0b';
  return '#10b981';
}

/* ── fallback mock so page never looks empty ─────────── */
const FALLBACK_STOCK = [
  { product_name: 'Silicon Sensors',   current_stock: 45,   reorder_point: 100, safety_stock: 80,  status: 'LOW' },
  { product_name: 'Raw Steel Coils',   current_stock: 320,  reorder_point: 150, safety_stock: 120, status: 'OK' },
  { product_name: 'Micro-controllers', current_stock: 88,   reorder_point: 120, safety_stock: 100, status: 'LOW' },
  { product_name: 'Packaging Film',    current_stock: 1200, reorder_point: 400, safety_stock: 300, status: 'OK' },
  { product_name: 'Fasteners M8',      current_stock: 640,  reorder_point: 300, safety_stock: 200, status: 'OK' },
];

export default function InventoryBody({ agent }) {
  const [stock, setStock] = useState(FALLBACK_STOCK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /inventory/ from inventory-agent (port 8003, proxied via /api/inventory)
      const res = await fetch('/api/inventory/inventory/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setStock(data);
      }
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    } catch (err) {
      setError(`Backend unavailable — showing demo data. (${err.message})`);
      // keep fallback data visible
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  /* ── compute summary KPIs from live data ───────────── */
  const criticalItems = stock.filter(
    (s) => s.current_stock < (s.reorder_point || s.safety_stock || 0)
  );
  const avgRunway = stock.length
    ? (stock.reduce((acc, s) => {
        const dailyUsage = Math.max(1, (s.reorder_point || 100) / 5);
        return acc + s.current_stock / dailyUsage;
      }, 0) / stock.length).toFixed(1)
    : '–';
  const fillRate = stock.length
    ? Math.round(
        (stock.filter((s) => s.current_stock >= (s.reorder_point || 0)).length / stock.length) * 100
      )
    : 96;

  const runways = [
    { label: 'Avg Runway',    value: avgRunway,          unit: 'days', ring: Math.min(100, parseFloat(avgRunway) * 5) },
    { label: 'Critical SKUs', value: criticalItems.length, unit: 'items', ring: Math.min(100, criticalItems.length * 15) },
    { label: 'Fill Rate',     value: fillRate,            unit: '%',   ring: fillRate },
  ];

  /* ── static warehouse display (no warehouse API exists yet) */
  const warehouses = [
    { code: 'WH-1', name: 'Central',    fill: 82 },
    { code: 'WH-2', name: 'North Dock', fill: 61 },
    { code: 'WH-3', name: 'Overflow',   fill: 34 },
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

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: 12, color: '#6b7280' }}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Fetching live data…
          </span>
        ) : (
          <>
            <span style={{ color: error ? '#f59e0b' : '#10b981' }}>
              {error ? '⚠ ' + error : `✓ Live data · Updated ${lastUpdated}`}
            </span>
            <button
              onClick={fetchInventory}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, fontSize: 12 }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </>
        )}
      </div>

      <div className="grid">
        {/* Stock levels */}
        <div className="card span-8">
          <div className="card-title"><Boxes size={18} color={agent.accent} /> Stock Levels vs. Threshold</div>
          <div className="stock-list">
            {stock.map((s) => {
              const threshold = s.reorder_point || s.safety_stock || 100;
              const low = s.current_stock < threshold;
              const barColor = low ? '#f43f5e' : statusColor(s.status) === '#f43f5e' ? '#f59e0b' : agent.accent;
              return (
                <div className="stock-row" key={s.product_name || s.id}>
                  <div className="stock-name">
                    {low && <AlertTriangle size={14} className="stock-warn" />}
                    {s.product_name}
                  </div>
                  <div className="stock-track">
                    <span className="stock-thresh" style={{ left: `${pct(threshold, threshold)}%` }} />
                    <span
                      className="stock-fill"
                      style={{ width: `${pct(s.current_stock, threshold)}%`, background: barColor }}
                    />
                  </div>
                  <div className="stock-num">
                    {s.current_stock?.toLocaleString()} <small>units</small>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="legend"><span className="legend-thresh" /> reorder threshold</p>
        </div>

        {/* Warehouse fill (static – no warehouse API) */}
        <div className="card span-4">
          <div className="card-title"><Warehouse size={18} color={agent.accent} /> Warehouse Fill</div>
          <div className="wh-list">
            {warehouses.map((w) => (
              <div className="wh-item" key={w.code}>
                <div className="wh-top"><b>{w.code}</b><span>{w.name}</span><em>{w.fill}%</em></div>
                <div className="wh-bar"><span style={{ width: `${w.fill}%`, background: agent.accent }} /></div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
            {stock.length} SKUs tracked · {criticalItems.length} below reorder point
          </p>
        </div>
      </div>
    </>
  );
}
