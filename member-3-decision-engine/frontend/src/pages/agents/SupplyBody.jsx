import React, { useEffect, useState } from 'react';
import { Award, Truck, Clock, ShieldCheck, RefreshCw, Plus, CheckCircle2, Search, Info, ShieldAlert } from 'lucide-react';

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
    id: `PO-${5100 + (s.id ?? i)}`,
    item: `${s.material_name || s.supplier_name} ×${(i + 1) * 200}`,
    status: statusMap[i % 4],
    eta: i === 2 ? 'Delayed' : `${s.lead_time_days ?? (i + 2) * 2} days`,
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
    <>
      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <span style={{ color: error ? '#f59e0b' : '#10b981', fontWeight: 500 }}>
            {error ? '⚠ ' + error : `✓ Neon Cloud Synced · ${suppliers.length} Live Global Suppliers (${lastUpdated || 'Active'})`}
          </span>
          <button onClick={fetchSuppliers} style={{ background: 'none', border: 'none', cursor: 'pointer', color: agent.accent, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            style={{ padding: '6px 12px', fontSize: 12, background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Info size={13} color="#3b82f6" /> {showFormulaInfo ? 'Hide Logic' : 'View Risk Formula'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '6px 12px', fontSize: 12, background: agent.accent, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}
          >
            <Plus size={13} /> {showAddForm ? 'Close Form' : 'Add New Supplier'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#10b98115', border: '1px solid #10b98144', color: '#10b981', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={15} /> {msg}
        </div>
      )}

      {/* Formula Info Card */}
      {showFormulaInfo && (
        <div className="card" style={{ marginBottom: 14, background: '#0f172a', border: '1px solid #3b82f644' }}>
          <div className="card-title" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={16} /> Supplier Risk Scoring & Recommendation Mathematical Algorithm
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 6 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>Risk Score Equation (0 - 100)</strong>
              <code style={{ background: '#0f172a', padding: '3px 6px', borderRadius: 4, color: '#38bdf8', display: 'inline-block', marginBottom: 4 }}>
                Risk = (100 - Quality)×0.3 + (100 - OnTime)×0.2 + DelayDays×10 + LeadTime×2
              </code>
              <p style={{ margin: 0, fontSize: 11 }}>Calculates overall supply chain vulnerability score based on real delivery metrics.</p>
            </div>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 6 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>Risk Level Thresholds</strong>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: '#10b981' }}>● Low Risk: &lt; 25.0</span> | <span style={{ color: '#f59e0b' }}>● Medium: 25-50</span> | <span style={{ color: '#f43f5e' }}>● High: &gt; 50</span>
              </div>
            </div>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 6 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>Recommendation Rule</strong>
              <p style={{ margin: 0, fontSize: 11 }}>A vendor receives <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Recommended</span> status when Risk is Low, Quality &gt; 90%, and On-Time &gt; 95%.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Form */}
      {showAddForm && (
        <form onSubmit={handleAddSupplier} style={{ background: '#111827', padding: 12, borderRadius: 6, marginBottom: 14, border: `1px solid ${agent.accent}44`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Supplier Name</label>
            <input type="text" placeholder="e.g. Apex Tech USA" value={supName} onChange={(e) => setSupName(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Material Supplied</label>
            <input type="text" placeholder="e.g. Silicon Wafer" value={matName} onChange={(e) => setMatName(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Avail Quantity</label>
            <input type="number" placeholder="5000" value={availQty} onChange={(e) => setAvailQty(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Lead Time (Days)</label>
            <input type="number" placeholder="5" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Price ($/unit)</label>
            <input type="number" step="0.01" placeholder="45.0" value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Quality Score (0-100)</label>
            <input type="number" step="0.1" placeholder="96.0" value={qualScore} onChange={(e) => setQualScore(e.target.value)} style={{ width: '100%', padding: '5px', background: '#1f2937', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11 }} required />
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

      <div className="grid">
        {/* Main Ranked Supplier List */}
        <div className="card span-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>
              <Award size={18} color={agent.accent} /> Supplier Roster ({filtered.length})
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Filter supplier or material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '4px 8px 4px 26px', background: '#111827', border: '1px solid #374151', borderRadius: 4, color: '#fff', fontSize: 11, width: 160 }}
                />
              </div>

              <div style={{ display: 'flex', background: '#111827', padding: 2, borderRadius: 4, border: '1px solid #374151' }}>
                {['ALL', 'RECOMMENDED', 'LOW', 'MEDIUM', 'HIGH'].map((tab) => (
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
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="supplier-list" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {filtered.map((s) => (
              <div className="supplier" key={s.id || s.supplier_name} style={{ marginBottom: 10, padding: 10, background: '#111827', borderRadius: 6, border: '1px solid #1f2937' }}>
                <div className="supplier-rank" style={{ background: `${agent.accent}1a`, color: agent.accent, fontWeight: 'bold' }}>
                  #{s._rank}
                </div>
                <div className="supplier-body">
                  <div className="supplier-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13, color: '#f3f4f6' }}>
                      {s.supplier_name} <small style={{ color: '#9ca3af', fontWeight: 'normal' }}>({s.material_name})</small>
                      {s.recommended && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: '#10b981', background: '#10b98122', borderRadius: 4, padding: '1px 6px', border: '1px solid #10b98144' }}>
                          ✓ Recommended
                        </span>
                      )}
                    </strong>
                    <span className="supplier-score" style={{ color: riskColor(s.risk_level), fontSize: 12, fontWeight: 'bold' }}>
                      Risk Score: {s.risk_score?.toFixed(1) ?? '–'}
                    </span>
                  </div>

                  <div className="score-track" style={{ height: 4, background: '#1f2937', borderRadius: 2, margin: '6px 0' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(5, 100 - (s.risk_score || 0))}%`, background: riskColor(s.risk_level), borderRadius: 2 }} />
                  </div>

                  <div className="supplier-meta" style={{ display: 'flex', gap: 14, fontSize: 11, color: '#9ca3af' }}>
                    <span><Clock size={12} inline /> {s.lead_time_days}d lead</span>
                    <span><ShieldCheck size={12} inline /> {s.on_time_delivery_percentage?.toFixed(0)}% on-time</span>
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

        {/* PO Timeline & Supplier Analytics */}
        <div className="card span-5">
          <div className="card-title"><Truck size={18} color={agent.accent} /> Active Purchase Orders & Vendor Analytics</div>
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

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1f2937', fontSize: 11, color: '#9ca3af' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Total Neon DB Suppliers</span><strong style={{ color: '#f3f4f6' }}>{suppliers.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Recommended Vendors</span><strong style={{ color: '#10b981' }}>{recCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>High Risk Suppliers</span><strong style={{ color: '#f43f5e' }}>{highRiskCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Average Vendor Risk Score</span>
              <strong style={{ color: '#f59e0b' }}>
                {suppliers.length ? (suppliers.reduce((a, b) => a + (b.risk_score || 0), 0) / suppliers.length).toFixed(1) : 0}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
