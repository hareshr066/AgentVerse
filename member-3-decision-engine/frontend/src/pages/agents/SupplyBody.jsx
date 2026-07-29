import React, { useEffect, useState } from 'react';
import { Award, Truck, Clock, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

/* ── fallback data so page never looks empty ─────────── */
const FALLBACK_SUPPLIERS = [
  { id: 1, supplier_name: 'Ironworks Local',  lead_time_days: 6,  quality_score: 96.0, on_time_delivery_percentage: 99, risk_score: 8,  risk_level: 'Low',    recommended: true  },
  { id: 2, supplier_name: 'Shenzhen Micro',   lead_time_days: 18, quality_score: 88.0, on_time_delivery_percentage: 94, risk_score: 22, risk_level: 'Low',    recommended: true  },
  { id: 3, supplier_name: 'Nordic Steel Co',  lead_time_days: 11, quality_score: 81.0, on_time_delivery_percentage: 90, risk_score: 35, risk_level: 'Medium', recommended: false },
  { id: 4, supplier_name: 'PacRim Freight',   lead_time_days: 21, quality_score: 72.0, on_time_delivery_percentage: 85, risk_score: 52, risk_level: 'High',   recommended: false },
];

/* ── helpers ─────────────────────────────────────────── */
function riskColor(level) {
  const l = (level || '').toLowerCase();
  if (l === 'low')    return '#10b981';
  if (l === 'medium') return '#f59e0b';
  if (l === 'high')   return '#f43f5e';
  return '#6b7280';
}

// Compute a 0-100 "supplier score" from backend fields (higher = better)
function supplierScore(s) {
  const reliability = s.on_time_delivery_percentage ?? 80;
  const quality     = s.quality_score ?? 70;
  const leadPenalty = Math.min(s.lead_time_days ?? 14, 30) / 30 * 20; // longer lead → worse
  const riskPenalty = (s.risk_score ?? 50) / 100 * 20;
  return Math.round(((reliability + quality) / 2) - leadPenalty - riskPenalty);
}

// Derive a PO-style timeline from supplier list (simulated from real data)
function buildTimeline(suppliers) {
  const statusMap = ['In Transit', 'Confirmed', 'Delayed', 'Delivered'];
  const toneMap   = ['#3b82f6',   '#14b8a6',   '#f43f5e', '#10b981'];
  return suppliers.slice(0, 4).map((s, i) => ({
    id:     `PO-${4800 + (s.id ?? i)}`,
    item:   `${s.material_name || s.supplier_name} ×${(i + 1) * 100}`,
    status: statusMap[i % 4],
    eta:    i === 3 ? 'done' : `${s.lead_time_days ?? (i + 2) * 2} days`,
    tone:   toneMap[i % 4],
  }));
}

export default function SupplyBody({ agent }) {
  const [suppliers, setSuppliers]   = useState(FALLBACK_SUPPLIERS);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /suppliers/ from supply-agent (port 8004, proxied via /api/supply)
      const res = await fetch('/api/supply/suppliers/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
      }
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    } catch (err) {
      setError(`Backend unavailable — showing demo data. (${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  // Sort by score descending and assign ranks
  const ranked = [...suppliers]
    .map((s) => ({ ...s, _score: supplierScore(s) }))
    .sort((a, b) => b._score - a._score)
    .map((s, i) => ({ ...s, _rank: i + 1 }));

  const timeline = buildTimeline(ranked);

  return (
    <div className="grid">
      {/* Supplier ranking */}
      <div className="card span-7">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color={agent.accent} /> Supplier Ranking
          </span>
          <span style={{ fontSize: 11, color: error ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? (
              <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
            ) : error ? (
              <><AlertTriangle size={11} /> Demo data</>
            ) : (
              <>✓ Live · {lastUpdated}</>
            )}
            {!loading && (
              <button
                onClick={fetchSuppliers}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, padding: 0, marginLeft: 6 }}
              >
                <RefreshCw size={11} />
              </button>
            )}
          </span>
        </div>

        <div className="supplier-list">
          {ranked.map((s) => (
            <div className="supplier" key={s.id ?? s.supplier_name}>
              <div
                className="supplier-rank"
                style={{ background: `${agent.accent}1a`, color: agent.accent }}
              >
                #{s._rank}
              </div>
              <div className="supplier-body">
                <div className="supplier-top">
                  <strong>
                    {s.supplier_name}
                    {s.recommended && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#10b981', background: '#10b98122', borderRadius: 4, padding: '1px 5px' }}>
                        Recommended
                      </span>
                    )}
                  </strong>
                  <span className="supplier-score" style={{ color: agent.accent }}>{s._score}</span>
                </div>
                <div className="score-track">
                  <span style={{ width: `${s._score}%`, background: agent.accent }} />
                </div>
                <div className="supplier-meta">
                  <span><Clock size={13} /> {s.lead_time_days}d lead</span>
                  <span><ShieldCheck size={13} /> {s.on_time_delivery_percentage?.toFixed(0)}% reliable</span>
                  <span style={{ color: riskColor(s.risk_level), fontSize: 11 }}>
                    ● {s.risk_level} risk
                  </span>
                  {s.delivery_delay_days > 0 && (
                    <span style={{ color: '#f43f5e', fontSize: 11 }}>
                      ⚠ {s.delivery_delay_days}d delay
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {suppliers.length === 0 && !loading && (
          <p style={{ color: '#6b7280', fontSize: 13, padding: '16px 0' }}>
            No suppliers in database yet. Add suppliers via the Supply Agent API.
          </p>
        )}
      </div>

      {/* Purchase Order timeline derived from supplier data */}
      <div className="card span-5">
        <div className="card-title"><Truck size={18} color={agent.accent} /> Purchase Order Timeline</div>
        <ol className="po-timeline">
          {timeline.map((o) => (
            <li key={o.id} style={{ '--tone': o.tone }}>
              <span className="po-node" />
              <div className="po-card">
                <div className="po-top"><b>{o.id}</b><span className="po-status">{o.status}</span></div>
                <p>{o.item}</p>
                <em>ETA: {o.eta}</em>
              </div>
            </li>
          ))}
        </ol>

        {/* Summary stats */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1f2937', fontSize: 12, color: '#9ca3af' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Total Suppliers</span><strong style={{ color: '#f3f4f6' }}>{suppliers.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Recommended</span>
            <strong style={{ color: '#10b981' }}>
              {suppliers.filter((s) => s.recommended).length}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>High Risk</span>
            <strong style={{ color: '#f43f5e' }}>
              {suppliers.filter((s) => (s.risk_level || '').toLowerCase() === 'high').length}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
