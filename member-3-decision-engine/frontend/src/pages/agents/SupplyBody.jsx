import React, { useEffect, useState } from 'react';
import { Award, Truck, Clock, ShieldCheck, RefreshCw, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';

const FALLBACK_SUPPLIERS = [
  { id: 1, supplier_name: 'Ironworks Local', material_name: 'Raw Steel Coils', lead_time_days: 6, quality_score: 96.0, on_time_delivery_percentage: 99, risk_score: 8, risk_level: 'Low Risk', recommended: true },
  { id: 2, supplier_name: 'Shenzhen Micro', material_name: 'Micro-controllers', lead_time_days: 18, quality_score: 88.0, on_time_delivery_percentage: 94, risk_score: 22, risk_level: 'Low Risk', recommended: true },
  { id: 3, supplier_name: 'Nordic Steel Co', material_name: 'Aluminium Sheets 4mm', lead_time_days: 11, quality_score: 81.0, on_time_delivery_percentage: 90, risk_score: 35, risk_level: 'Medium Risk', recommended: false },
  { id: 4, supplier_name: 'PacRim Freight', material_name: 'Packaging Film', lead_time_days: 21, quality_score: 72.0, on_time_delivery_percentage: 85, risk_score: 52, risk_level: 'High Risk', recommended: false },
];

function riskColor(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('low')) return '#10b981';
  if (l.includes('medium')) return '#f59e0b';
  if (l.includes('high') || l.includes('critical')) return '#f43f5e';
  return '#6b7280';
}

function buildTimeline(suppliers) {
  const statusMap = ['In Transit', 'Confirmed', 'Delayed', 'Delivered'];
  const toneMap   = ['#3b82f6',   '#14b8a6',   '#f43f5e', '#10b981'];
  return suppliers.slice(0, 5).map((s, i) => ({
    id: `PO-${4800 + (s.id ?? i)}`,
    item: `${s.material_name || s.supplier_name} ×${(i + 1) * 100}`,
    status: statusMap[i % 4],
    eta: i === 3 ? 'done' : `${s.lead_time_days ?? (i + 2) * 2} days`,
    tone: toneMap[i % 4],
  }));
}

export default function SupplyBody({ agent }) {
  const [suppliers, setSuppliers] = useState(FALLBACK_SUPPLIERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [supName, setSupName] = useState('');
  const [matName, setMatName] = useState('');
  const [availQty, setAvailQty] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [priceUnit, setPriceUnit] = useState('');
  const [qualScore, setQualScore] = useState('');
  const [onTimePct, setOnTimePct] = useState('');
  const [delayDays, setDelayDays] = useState('0');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/supply/suppliers/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
      }
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    } catch (err) {
      setError(`Backend offline — showing cached data. (${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supName || !matName || !availQty || !leadTime || !priceUnit || !qualScore || !onTimePct) return;
    setSaving(true);
    try {
      const payload = {
        supplier_name: supName,
        material_name: matName,
        available_quantity: parseInt(availQty),
        lead_time_days: parseInt(leadTime),
        price_per_unit: parseFloat(priceUnit),
        delivery_delay_days: parseInt(delayDays || 0),
        quality_score: parseFloat(qualScore),
        on_time_delivery_percentage: parseFloat(onTimePct)
      };

      const res = await fetch('/api/supply/suppliers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMsg(`Added Supplier '${supName}' & calculated Risk Score!`);
        setSupName('');
        setMatName('');
        setAvailQty('');
        setLeadTime('');
        setPriceUnit('');
        setQualScore('');
        setOnTimePct('');
        setShowAddForm(false);
        setTimeout(() => setMsg(null), 4000);
        await fetchSuppliers();
      }
    } catch (err) {
      setError(`Failed to save supplier: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const ranked = [...suppliers]
    .sort((a, b) => (a.risk_score ?? 50) - (b.risk_score ?? 50))
    .map((s, i) => ({ ...s, _rank: i + 1 }));

  const timeline = buildTimeline(ranked);

  return (
    <div className="grid">
      {/* Supplier Ranking & Calculation Controls */}
      <div className="card span-7">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color={agent.accent} /> Supplier Ranking & Risk Calculation
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ background: agent.accent, color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={12} /> {showAddForm ? 'Close' : 'Add Supplier'}
            </button>
            <button
              onClick={fetchSuppliers}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, padding: 0 }}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ marginBottom: 12, padding: '6px 12px', background: '#10b98115', border: '1px solid #10b98144', color: '#10b981', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} /> {msg}
          </div>
        )}

        {/* Add Supplier Form */}
        {showAddForm && (
          <form onSubmit={handleAddSupplier} style={{ background: '#111827', padding: 12, borderRadius: 6, marginBottom: 14, border: `1px solid ${agent.accent}44`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Supplier Name</label>
              <input type="text" placeholder="e.g. Apex Tech" value={supName} onChange={(e) => setSupName(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Material Supplied</label>
              <input type="text" placeholder="e.g. Silicon Sensors" value={matName} onChange={(e) => setMatName(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Avail Qty</label>
              <input type="number" placeholder="5000" value={availQty} onChange={(e) => setAvailQty(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Lead Time (Days)</label>
              <input type="number" placeholder="6" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Price ($/unit)</label>
              <input type="number" step="0.01" placeholder="45.0" value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Quality Score (0-100)</label>
              <input type="number" step="0.1" placeholder="95.0" value={qualScore} onChange={(e) => setQualScore(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>On-Time Delivery %</label>
              <input type="number" step="0.1" placeholder="98.0" value={onTimePct} onChange={(e) => setOnTimePct(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: '6px', background: agent.accent, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 11, cursor: 'pointer' }}>
                {saving ? 'Calculating…' : 'Calculate & Save'}
              </button>
            </div>
          </form>
        )}

        <div className="supplier-list">
          {ranked.map((s) => (
            <div className="supplier" key={s.id ?? s.supplier_name} style={{ marginBottom: 12 }}>
              <div className="supplier-rank" style={{ background: `${agent.accent}1a`, color: agent.accent }}>
                #{s._rank}
              </div>
              <div className="supplier-body">
                <div className="supplier-top">
                  <strong>
                    {s.supplier_name} <small style={{ color: '#9ca3af', fontWeight: 'normal' }}>({s.material_name})</small>
                    {s.recommended && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#10b981', background: '#10b98122', borderRadius: 4, padding: '1px 5px' }}>
                        ✓ Recommended
                      </span>
                    )}
                  </strong>
                  <span className="supplier-score" style={{ color: riskColor(s.risk_level), fontSize: 12, fontWeight: 'bold' }}>
                    Risk: {s.risk_score?.toFixed(1) ?? '–'}
                  </span>
                </div>
                <div className="score-track">
                  <span style={{ width: `${Math.max(5, 100 - (s.risk_score || 0))}%`, background: riskColor(s.risk_level) }} />
                </div>
                <div className="supplier-meta" style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11 }}>
                  <span><Clock size={13} /> {s.lead_time_days}d lead</span>
                  <span><ShieldCheck size={13} /> {s.on_time_delivery_percentage?.toFixed(0)}% on-time</span>
                  <span>Quality: <strong style={{ color: '#f3f4f6' }}>{s.quality_score}%</strong></span>
                  <span style={{ color: riskColor(s.risk_level), fontWeight: 'bold' }}>
                    ● {s.risk_level}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PO Timeline & Supplier Analytics */}
      <div className="card span-5">
        <div className="card-title"><Truck size={18} color={agent.accent} /> Purchase Orders & Analytics</div>
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

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1f2937', fontSize: 12, color: '#9ca3af' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Total Suppliers</span><strong style={{ color: '#f3f4f6' }}>{suppliers.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Recommended Vendors</span>
            <strong style={{ color: '#10b981' }}>
              {suppliers.filter((s) => s.recommended).length}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Average Risk Score</span>
            <strong style={{ color: '#f59e0b' }}>
              {suppliers.length ? (suppliers.reduce((a, b) => a + (b.risk_score || 0), 0) / suppliers.length).toFixed(1) : 0}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
