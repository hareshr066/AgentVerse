import React, { useEffect, useState } from 'react';
import { Award, Truck, Clock, ShieldCheck, RefreshCw, Plus, CheckCircle2, Search, Info, MapPin } from 'lucide-react';

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
    id: `PO-IND-${6100 + (s.id ?? i)}`,
    item: `${s.material_name || s.supplier_name} ×${(i + 1) * 500}`,
    status: statusMap[i % 4],
    eta: i === 2 ? 'Delayed (Rain)' : `${s.lead_time_days ?? (i + 2) * 2} days`,
    tone: toneMap[i % 4],
  }));
}

export default function SupplyBody({ agent }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form inputs
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
        setMsg(`Added Indian Supplier '${supName}' & calculated Risk Score!`);
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

  // Ranking & Filter logic
  const ranked = [...suppliers]
    .sort((a, b) => (a.risk_score ?? 50) - (b.risk_score ?? 50))
    .map((s, i) => ({ ...s, _rank: i + 1 }));

  const filtered = ranked.filter((s) => {
    const term = search.toLowerCase();
    const matches = (s.supplier_name || '').toLowerCase().includes(term) || (s.material_name || '').toLowerCase().includes(term);
    const rl = (s.risk_level || '').toLowerCase();
    if (filterTab === 'RECOMMENDED') return matches && s.recommended;
    if (filterTab === 'LOW') return matches && rl.includes('low');
    if (filterTab === 'MEDIUM') return matches && rl.includes('medium');
    if (filterTab === 'HIGH') return matches && (rl.includes('high') || rl.includes('critical'));
    return matches;
  });

  const timeline = buildTimeline(ranked);
  const recCount = suppliers.filter((s) => s.recommended).length;
  const highRiskCount = suppliers.filter((s) => (s.risk_level || '').toLowerCase().includes('high')).length;

  return (
    <div style={{ fontSize: 14 }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13 }}>
          <span style={{ color: error ? '#f59e0b' : '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {error ? '⚠ ' + error : `🇮🇳 Neon Cloud Synced · ${suppliers.length} Live Indian Industrial Vendors (${lastUpdated || 'Active'})`}
          </span>
          <button onClick={fetchSuppliers} style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            style={{ padding: '8px 14px', fontSize: 13, background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
          >
            <Info size={15} color="#3b82f6" /> {showFormulaInfo ? 'Hide Formula' : 'View Risk Scoring Logic'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '8px 16px', fontSize: 13, background: agent.accent, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}
          >
            <Plus size={15} /> {showAddForm ? 'Close Form' : '+ Add New Supplier'}
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
            <Award size={18} /> Supplier Risk Scoring & Vendor Recommendation Algorithm
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>1. Risk Score Equation (0 - 100)</strong>
              <code style={{ background: '#0f172a', padding: '4px 8px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 6, fontSize: 13 }}>
                Risk = (100 - Quality)×0.3 + (100 - OnTime)×0.2 + DelayDays×10 + LeadTime×2
              </code>
              <p style={{ margin: 0, fontSize: 12 }}>Evaluates vendor risk based on defect rate, delivery delays, and shipping lead times.</p>
            </div>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>2. Risk Threshold Categories</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>● Low Risk: &lt; 25.0</span> | <span style={{ color: '#f59e0b', fontWeight: 600 }}>● Medium: 25 - 50</span> | <span style={{ color: '#f43f5e', fontWeight: 600 }}>● High: &gt; 50</span>
              </div>
            </div>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>3. Recommendation Rule</strong>
              <p style={{ margin: 0, fontSize: 12 }}>A vendor is awarded <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Recommended</span> status if Risk is Low, Quality &gt; 90%, and On-Time &gt; 95%.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Form */}
      {showAddForm && (
        <form onSubmit={handleAddSupplier} style={{ background: '#111827', padding: 18, borderRadius: 8, marginBottom: 18, border: `1px solid ${agent.accent}66`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>Supplier Name & Location</label>
            <input type="text" placeholder="e.g. Jindal Steel (Hisar, HR)" value={supName} onChange={(e) => setSupName(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#fff', fontSize: 13, height: 38 }} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>Material Supplied</label>
            <input type="text" placeholder="e.g. Stainless Steel Pipes" value={matName} onChange={(e) => setMatName(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#fff', fontSize: 13, height: 38 }} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>Available Quantity</label>
            <input type="number" placeholder="e.g. 10000" value={availQty} onChange={(e) => setAvailQty(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#fff', fontSize: 13, height: 38 }} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>Lead Time (Days)</label>
            <input type="number" placeholder="e.g. 5" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#fff', fontSize: 13, height: 38 }} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>Unit Price ($ / ₹)</label>
            <input type="number" step="0.01" placeholder="e.g. 45.0" value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#fff', fontSize: 13, height: 38 }} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>Quality Score (0-100)</label>
            <input type="number" step="0.1" placeholder="e.g. 96.0" value={qualScore} onChange={(e) => setQualScore(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#fff', fontSize: 13, height: 38 }} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>On-Time Delivery %</label>
            <input type="number" step="0.1" placeholder="e.g. 98.0" value={onTimePct} onChange={(e) => setOnTimePct(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: '#1f2937', border: '1px solid #4b5563', borderRadius: 6, color: '#fff', fontSize: 13, height: 38 }} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ width: '100%', height: 38, background: agent.accent, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Calculating…' : 'Calculate & Save Vendor'}
            </button>
          </div>
        </form>
      )}

      <div className="grid" style={{ gap: 16 }}>
        {/* Main Ranked Supplier List */}
        <div className="card span-7" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title" style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={20} color={agent.accent} /> Indian Supplier Roster ({filtered.length})
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Filter supplier or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '7px 12px 7px 32px', background: '#111827', border: '1px solid #374151', borderRadius: 6, color: '#fff', fontSize: 13, width: 200, height: 36 }}
                />
              </div>

              <div style={{ display: 'flex', background: '#111827', padding: 3, borderRadius: 6, border: '1px solid #374151' }}>
                {['ALL', 'RECOMMENDED', 'LOW', 'MEDIUM', 'HIGH'].map((tab) => (
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
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="supplier-list" style={{ maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
            {filtered.map((s) => (
              <div className="supplier" key={s.id || s.supplier_name} style={{ marginBottom: 12, padding: 14, background: '#111827', borderRadius: 8, border: '1px solid #1f2937' }}>
                <div className="supplier-rank" style={{ background: `${agent.accent}22`, color: agent.accent, fontWeight: 'bold', fontSize: 15, width: 36, height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  #{s._rank}
                </div>
                <div className="supplier-body" style={{ flex: 1 }}>
                  <div className="supplier-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 15, color: '#f3f4f6' }}>
                      {s.supplier_name} <small style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: 13 }}>({s.material_name})</small>
                      {s.recommended && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#10b981', background: '#10b98122', borderRadius: 4, padding: '2px 8px', border: '1px solid #10b98144', fontWeight: 600 }}>
                          ✓ Recommended
                        </span>
                      )}
                    </strong>
                    <span className="supplier-score" style={{ color: riskColor(s.risk_level), fontSize: 14, fontWeight: 'bold' }}>
                      Risk Score: {s.risk_score?.toFixed(1) ?? '–'}
                    </span>
                  </div>

                  <div className="score-track" style={{ height: 6, background: '#1f2937', borderRadius: 3, margin: '8px 0' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(5, 100 - (s.risk_score || 0))}%`, background: riskColor(s.risk_level), borderRadius: 3 }} />
                  </div>

                  <div className="supplier-meta" style={{ display: 'flex', gap: 16, fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
                    <span><Clock size={14} inline /> {s.lead_time_days}d lead</span>
                    <span><ShieldCheck size={14} inline /> {s.on_time_delivery_percentage?.toFixed(0)}% on-time</span>
                    <span>Quality: <strong style={{ color: '#f3f4f6' }}>{s.quality_score}%</strong></span>
                    <span>Price: <strong style={{ color: '#10b981' }}>${s.price_per_unit}</strong>/unit</span>
                    <span style={{ color: riskColor(s.risk_level), fontWeight: 'bold', marginLeft: 'auto' }}>
                      ● {s.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Orders & Analytics */}
        <div className="card span-5" style={{ padding: 20 }}>
          <div className="card-title" style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={20} color={agent.accent} /> Indian PO Dispatch & Analytics</div>
          <ol className="po-timeline" style={{ marginTop: 14 }}>
            {timeline.map((o) => (
              <li key={o.id} style={{ '--tone': o.tone, marginBottom: 14 }}>
                <span className="po-node" />
                <div className="po-card" style={{ padding: 12 }}>
                  <div className="po-top" style={{ fontSize: 13 }}><b>{o.id}</b><span className="po-status">{o.status}</span></div>
                  <p style={{ fontSize: 13, marginTop: 4 }}>{o.item}</p>
                  <em style={{ fontSize: 12 }}>ETA: {o.eta}</em>
                </div>
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #1f2937', fontSize: 13, color: '#9ca3af' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Total Indian Vendors</span><strong style={{ color: '#f3f4f6' }}>{suppliers.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Recommended Suppliers</span><strong style={{ color: '#10b981' }}>{recCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Medium / High Risk Vendors</span><strong style={{ color: '#f59e0b' }}>{suppliers.length - recCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Average Vendor Risk Score</span>
              <strong style={{ color: '#10b981' }}>
                {suppliers.length ? (suppliers.reduce((a, b) => a + (b.risk_score || 0), 0) / suppliers.length).toFixed(1) : 0}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
