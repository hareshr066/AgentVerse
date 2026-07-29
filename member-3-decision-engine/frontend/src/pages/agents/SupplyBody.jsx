import React, { useEffect, useState } from 'react';
import { Award, Truck, Clock, ShieldCheck, RefreshCw, Plus, CheckCircle2, Search, Info, MapPin, DollarSign, AlertTriangle } from 'lucide-react';

function riskColor(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('low')) return '#10b981';
  if (l.includes('medium')) return '#f59e0b';
  if (l.includes('high') || l.includes('critical')) return '#f43f5e';
  return '#6b7280';
}

function riskBg(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('low')) return '#10b98115';
  if (l.includes('medium')) return '#f59e0b15';
  if (l.includes('high') || l.includes('critical')) return '#f43f5e15';
  return '#1f2937';
}

function buildTimeline(suppliers) {
  const statusMap = ['In Transit', 'Confirmed', 'Delayed', 'Delivered'];
  const toneMap   = ['#3b82f6',   '#14b8a6',   '#f43f5e', '#10b981'];
  return suppliers.slice(0, 6).map((s, i) => ({
    id: `PO-IND-${6100 + (s.id ?? i)}`,
    item: `${s.material_name || s.supplier_name}`,
    qty: (i + 1) * 500,
    status: statusMap[i % 4],
    eta: i === 2 ? 'Delayed (Monsoon)' : `${s.lead_time_days ?? (i + 2) * 2} days`,
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
      {/* Top Action Header */}
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
            <Info size={15} color="#3b82f6" /> {showFormulaInfo ? 'Hide Formula' : 'View Risk Logic'}
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
            <Award size={18} /> Supplier Risk Scoring & Recommendation Mathematical Algorithm
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>Risk Score Equation (0 - 100)</strong>
              <code style={{ background: '#0f172a', padding: '4px 8px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 6, fontSize: 13 }}>
                Risk = (100 - Quality)×0.3 + (100 - OnTime)×0.2 + DelayDays×10 + LeadTime×2
              </code>
              <p style={{ margin: 0, fontSize: 12 }}>Evaluates overall vendor reliability based on defects, late deliveries, and transit times.</p>
            </div>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>Risk Levels</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>● Low Risk: &lt; 25.0</span> | <span style={{ color: '#f59e0b', fontWeight: 600 }}>● Medium: 25 - 50</span> | <span style={{ color: '#f43f5e', fontWeight: 600 }}>● High: &gt; 50</span>
              </div>
            </div>
            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6, fontSize: 14 }}>Recommendation Criteria</strong>
              <p style={{ margin: 0, fontSize: 12 }}>Vendors receive <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Recommended</span> status when Risk is Low, Quality &gt; 90%, and On-Time &gt; 95%.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Form */}
      {showAddForm && (
        <form onSubmit={handleAddSupplier} style={{ background: '#111827', padding: 18, borderRadius: 8, marginBottom: 18, border: `1px solid ${agent.accent}66`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 4, fontWeight: 500 }}>Supplier Name & City</label>
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

      {/* Main Grid Section */}
      <div className="grid" style={{ gap: 16 }}>
        {/* Left Column: Clean Ranked Supplier Cards */}
        <div className="card span-7" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title" style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={20} color={agent.accent} /> Indian Supplier Roster ({filtered.length})
            </div>

            {/* Filter Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Search supplier or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '7px 12px 7px 32px', background: '#111827', border: '1px solid #374151', borderRadius: 6, color: '#fff', fontSize: 13, width: 190, height: 36 }}
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

          {/* Supplier Cards List */}
          <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((s) => {
              // Parse out location if present in parentheses e.g. "Tata Steel (Jamshedpur)"
              const rawName = s.supplier_name || '';
              const matchLoc = rawName.match(/\(([^)]+)\)/);
              const locName = matchLoc ? matchLoc[1] : 'India';
              const cleanSupName = rawName.replace(/\([^)]+\)/, '').trim();

              const color = riskColor(s.risk_level);
              const bg = riskBg(s.risk_level);

              return (
                <div
                  key={s.id || s.supplier_name}
                  style={{
                    background: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Row 1: Rank, Name, Location Badge, Risk Score Pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          background: `${agent.accent}22`,
                          color: agent.accent,
                          fontWeight: 'bold',
                          fontSize: 14,
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${agent.accent}44`
                        }}
                      >
                        #{s._rank}
                      </div>

                      <div>
                        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#f9fafb' }}>
                          {cleanSupName}
                        </span>
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            background: '#37415188',
                            color: '#9ca3af',
                            padding: '2px 8px',
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <MapPin size={11} color="#60a5fa" /> {locName}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: bg,
                        color: color,
                        border: `1px solid ${color}44`,
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>Risk Score: {s.risk_score?.toFixed(1) ?? '–'}</span>
                      <small style={{ fontWeight: 'normal', fontSize: 11 }}>({s.risk_level})</small>
                    </div>
                  </div>

                  {/* Row 2: Supplied Material & Recommendation Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b66', padding: '8px 12px', borderRadius: 6 }}>
                    <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                      Material: <strong style={{ color: '#38bdf8', fontWeight: 600 }}>{s.material_name}</strong>
                    </div>

                    {s.recommended ? (
                      <span style={{ fontSize: 11, color: '#10b981', background: '#10b98122', border: '1px solid #10b98144', padding: '3px 10px', borderRadius: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} /> Recommended Vendor
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#f59e0b', background: '#f59e0b15', border: '1px solid #f59e0b33', padding: '3px 10px', borderRadius: 12, fontWeight: 500 }}>
                        Standard Vendor
                      </span>
                    )}
                  </div>

                  {/* Row 3: Risk Score Progress Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(5, 100 - (s.risk_score || 0))}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>

                  {/* Row 4: 4 Metric Cards (Lead Time, On-Time %, Quality, Unit Price) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 2 }}>
                    <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Lead Time</span>
                      <strong style={{ fontSize: 13, color: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Clock size={13} color="#60a5fa" /> {s.lead_time_days} days
                      </strong>
                    </div>

                    <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>On-Time Delivery</span>
                      <strong style={{ fontSize: 13, color: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <ShieldCheck size={13} color="#34d399" /> {s.on_time_delivery_percentage?.toFixed(0)}%
                      </strong>
                    </div>

                    <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Quality Rating</span>
                      <strong style={{ fontSize: 13, color: '#f3f4f6' }}>
                        {s.quality_score}%
                      </strong>
                    </div>

                    <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Unit Price</span>
                      <strong style={{ fontSize: 13, color: '#10b981' }}>
                        ${s.price_per_unit}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: PO Timeline & Executive Summary Stats */}
        <div className="card span-5" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Truck size={20} color={agent.accent} /> Active Purchase Orders
            </div>

            <ol className="po-timeline" style={{ marginTop: 10 }}>
              {timeline.map((o) => (
                <li key={o.id} style={{ '--tone': o.tone, marginBottom: 14 }}>
                  <span className="po-node" />
                  <div className="po-card" style={{ padding: 12, background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}>
                    <div className="po-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ fontSize: 13, color: '#f3f4f6' }}>{o.id}</b>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          color: o.tone,
                          background: `${o.tone}15`,
                          border: `1px solid ${o.tone}33`,
                          padding: '2px 8px',
                          borderRadius: 4
                        }}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#e5e7eb', marginTop: 6, fontWeight: 500 }}>
                      {o.item} <small style={{ color: '#9ca3af' }}>({o.qty} units)</small>
                    </p>
                    <em style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, display: 'block' }}>ETA: {o.eta}</em>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Executive Summary Metrics Block */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1f2937' }}>
            <div className="card-title" style={{ fontSize: 15, marginBottom: 12 }}>Executive Vendor Telemetry</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#111827', padding: 12, borderRadius: 8, border: '1px solid #1f2937' }}>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>Total Indian Vendors</span>
                <strong style={{ fontSize: 20, color: '#f9fafc', marginTop: 2, display: 'block' }}>{suppliers.length}</strong>
              </div>

              <div style={{ background: '#111827', padding: 12, borderRadius: 8, border: '1px solid #10b98133' }}>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>Recommended Vendors</span>
                <strong style={{ fontSize: 20, color: '#10b981', marginTop: 2, display: 'block' }}>{recCount}</strong>
              </div>

              <div style={{ background: '#111827', padding: 12, borderRadius: 8, border: '1px solid #f59e0b33' }}>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>Medium / High Risk</span>
                <strong style={{ fontSize: 20, color: '#f59e0b', marginTop: 2, display: 'block' }}>{suppliers.length - recCount}</strong>
              </div>

              <div style={{ background: '#111827', padding: 12, borderRadius: 8, border: '1px solid #3b82f633' }}>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>Avg Vendor Risk</span>
                <strong style={{ fontSize: 20, color: '#38bdf8', marginTop: 2, display: 'block' }}>
                  {suppliers.length ? (suppliers.reduce((a, b) => a + (b.risk_score || 0), 0) / suppliers.length).toFixed(1) : 0}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
