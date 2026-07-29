import React, { useState, useEffect } from 'react';
import {
  Factory, Gauge, Calendar, AlertTriangle, Play, RefreshCw,
  Cpu, CheckCircle2, DollarSign, Globe, Sun, Layers, Clock, TrendingUp
} from 'lucide-react';
import { AgentChart } from '../../components/widgets.jsx';

export default function ProductionBody({ agent }) {
  // ── Input State for Interactive Simulator ───────────────────────────
  const [product, setProduct] = useState('Hindalco Aluminium Sheets 4mm');
  const [forecastDemand, setForecastDemand] = useState(12000);
  const [currentInventory, setCurrentInventory] = useState(4200);
  const [safetyStock, setSafetyStock] = useState(1000);
  const [supplierDelay, setSupplierDelay] = useState(true);
  const [delayDays, setDelayDays] = useState(4);
  const [dailyCapacity, setDailyCapacity] = useState(900);
  const [numMachines, setNumMachines] = useState(2);
  const [unitCost, setUnitCost] = useState(45);
  const [region, setRegion] = useState('Asia Pacific');
  const [season, setSeason] = useState('Summer (Peak)');

  const [loading, setLoading] = useState(false);
  const [dbProducts, setDbProducts] = useState([]);

  // Fetch real database items on mount
  useEffect(() => {
    async function loadDbItems() {
      try {
        const res = await fetch('/api/inventory/inventory/');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDbProducts(data);
            const first = data[0];
            setProduct(first.product_name);
            setCurrentInventory(first.current_stock || 0);
            if (first.safety_stock) setSafetyStock(first.safety_stock);
          }
        }
      } catch (e) {
        console.warn('Could not load inventory items from DB:', e);
      }
    }
    loadDbItems();
  }, []);

  const handleProductSelect = (selectedName) => {
    setProduct(selectedName);
    const found = dbProducts.find((p) => p.product_name === selectedName);
    if (found) {
      setCurrentInventory(found.current_stock || 0);
      if (found.safety_stock) setSafetyStock(found.safety_stock);
    }
  };

  // ── Calculated / Computed Plan State ────────────────────────────────
  const [plan, setPlan] = useState({
    product: 'Hindalco Aluminium Sheets 4mm',
    production_quantity: 8800,
    production_days: 10,
    capacity_utilization: '98%',
    priority: 'HIGH',
    factory_status: 'HIGH DEMAND DEFICIT',
    risk_level: 'High',
    machine_schedule: [
      { machine: 'Machine A', allocated: 500, shift_hours: 8.0, utilization: 100, status: 'Running' },
      { machine: 'Machine B', allocated: 400, shift_hours: 8.0, utilization: 95, status: 'Running' },
    ],
    bottlenecks: ['Supplier delay active (4 days)', 'Demand deficit detected'],
    optimized_usage: 'Production distributed across 2 machines operating at 98% capacity utilization over 10 days.',
  });

  // ── Simulator Plan Generation Handler ──────────────────────────────
  const handleGeneratePlan = async () => {
    setLoading(true);

    const payload = {
      product,
      forecast_demand: Number(forecastDemand),
      current_inventory: Number(currentInventory),
      safety_stock: Number(safetyStock),
      supplier_delay: Boolean(supplierDelay),
      delay_days: Number(delayDays),
      daily_capacity: Number(dailyCapacity),
      num_machines: Number(numMachines),
      production_cost: Number(unitCost),
      region,
      season,
      machines: [
        { name: 'Machine A', capacity: Math.ceil(Number(dailyCapacity) * 0.55) },
        { name: 'Machine B', capacity: Math.floor(Number(dailyCapacity) * 0.45) },
      ]
    };

    try {
      const res = await fetch('http://localhost:8005/production-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setPlan({
          ...data,
          factory_status: data.priority === 'CRITICAL' ? 'CRITICAL BOTTLENECK' : (data.priority === 'HIGH' ? 'HIGH DEMAND DEFICIT' : 'OPTIMAL OPERATIONS'),
          risk_level: data.priority === 'CRITICAL' ? 'Critical' : (data.priority === 'HIGH' ? 'High' : 'Low'),
        });
      } else {
        computeLocalSimulation(payload);
      }
    } catch (err) {
      computeLocalSimulation(payload);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const computeLocalSimulation = (p) => {
    const qty = Math.max(0, p.forecast_demand - p.current_inventory + p.safety_stock);
    const days = qty > 0 ? Math.ceil(qty / Math.max(1, p.daily_capacity)) : 0;
    const utilVal = days > 0 ? Math.round((qty / (p.daily_capacity * days)) * 100) : 0;
    const priority = (p.supplier_delay && p.delay_days > 5) ? 'CRITICAL' : (p.forecast_demand > p.current_inventory ? 'HIGH' : 'NORMAL');
    const risk = priority === 'CRITICAL' ? 'Critical' : (priority === 'HIGH' ? 'High' : 'Low');

    const machA = Math.ceil(p.daily_capacity * 0.55);
    const machB = p.daily_capacity - machA;

    setPlan({
      product: p.product,
      production_quantity: qty,
      production_days: days,
      capacity_utilization: `${utilVal}%`,
      priority,
      factory_status: priority === 'CRITICAL' ? 'CRITICAL BOTTLENECK' : (priority === 'HIGH' ? 'HIGH DEMAND DEFICIT' : 'OPTIMAL OPERATIONS'),
      risk_level: risk,
      machine_schedule: [
        { machine: 'Machine A', allocated: machA, shift_hours: 8.0, utilization: 100, status: 'Running' },
        { machine: 'Machine B', allocated: machB, shift_hours: 8.0, utilization: 95, status: 'Running' },
      ],
      bottlenecks: p.supplier_delay ? [`Supplier delay active (${p.delay_days} days)`] : ['No critical bottlenecks'],
      optimized_usage: `Production run of ${qty.toLocaleString()} units scheduled across ${p.num_machines} machines operating at ${utilVal}% capacity.`,
    });
  };

  // Chart data for Capacity Distribution
  const chartSeries = [
    { name: 'Day 1', primary: 900, secondary: 880 },
    { name: 'Day 3', primary: 2700, secondary: 2640 },
    { name: 'Day 5', primary: 4500, secondary: 4400 },
    { name: 'Day 7', primary: 6300, secondary: 6160 },
    { name: 'Day 9', primary: 8100, secondary: 7920 },
    { name: 'Day 10', primary: 9000, secondary: 8800 },
  ];

  return (
    <div className="simulator-container">
      {/* ── Factory Status Header Banner ────────────────────────────── */}
      <div className="status-banner" style={{ '--accent': agent.accent }}>
        <div className="status-banner-left">
          <span className="status-dot-pulse" />
          <span className="status-banner-title">FACTORY STATUS: <strong>{plan.factory_status}</strong></span>
        </div>
        <div className="status-banner-right">
          <span className="status-chip chip-risk">Risk Level: <strong>{plan.risk_level}</strong></span>
          <span className="status-chip chip-priority">Priority: <strong>{plan.priority}</strong></span>
        </div>
      </div>

      {/* ── INTERACTIVE SIMULATOR FORM ──────────────────────────────── */}
      <div className="card span-12 simulator-form-card">
        <div className="card-title">
          <Cpu size={18} color={agent.accent} /> Interactive Factory Simulator Parameters
        </div>
        <p className="form-subtitle">
          Adjust manufacturing parameters below and click <strong>Generate Production Plan</strong> to simulate execution.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label>Product Name</label>
            <select value={product} onChange={(e) => handleProductSelect(e.target.value)}>
              {dbProducts.length > 0 ? (
                dbProducts.map((p) => (
                  <option key={p.id || p.product_name} value={p.product_name}>
                    {p.product_name} ({p.current_stock} in stock)
                  </option>
                ))
              ) : (
                <>
                  <option value="Hindalco Aluminium Sheets 4mm">Hindalco Aluminium Sheets 4mm</option>
                  <option value="Bharat Forge Forged Crankshafts">Bharat Forge Forged Crankshafts</option>
                  <option value="L&T 3-Phase Switchgears">L&T 3-Phase Switchgears</option>
                  <option value="Sundram Fasteners M8/M12">Sundram Fasteners M8/M12</option>
                  <option value="Polycab Armoured Copper Cables">Polycab Armoured Copper Cables</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Forecast Demand (Units)</label>
            <input type="number" value={forecastDemand} onChange={(e) => setForecastDemand(e.target.value)} min="0" />
          </div>

          <div className="form-group">
            <label>Current Inventory (Units)</label>
            <input type="number" value={currentInventory} onChange={(e) => setCurrentInventory(e.target.value)} min="0" />
          </div>

          <div className="form-group">
            <label>Safety Stock Buffer (Units)</label>
            <input type="number" value={safetyStock} onChange={(e) => setSafetyStock(e.target.value)} min="0" />
          </div>

          <div className="form-group">
            <label>Daily Machine Capacity (Units/Day)</label>
            <input type="number" value={dailyCapacity} onChange={(e) => setDailyCapacity(e.target.value)} min="1" />
          </div>

          <div className="form-group">
            <label>Number of Machines</label>
            <input type="number" value={numMachines} onChange={(e) => setNumMachines(e.target.value)} min="1" max="10" />
          </div>

          <div className="form-group">
            <label>Supplier Delay Active?</label>
            <div className="toggle-group">
              <button className={`toggle-btn ${supplierDelay ? 'active' : ''}`} onClick={() => setSupplierDelay(true)}>Yes</button>
              <button className={`toggle-btn ${!supplierDelay ? 'active' : ''}`} onClick={() => setSupplierDelay(false)}>No</button>
            </div>
          </div>

          {supplierDelay && (
            <div className="form-group">
              <label>Delay Duration (Days)</label>
              <input type="number" value={delayDays} onChange={(e) => setDelayDays(e.target.value)} min="1" />
            </div>
          )}

          <div className="form-group">
            <label>Unit Production Cost ($)</label>
            <input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} min="1" />
          </div>

          <div className="form-group">
            <label>Manufacturing Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="Asia Pacific">Asia Pacific</option>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
            </select>
          </div>

          <div className="form-group">
            <label>Season / Market Phase</label>
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="Summer (Peak)">Summer (Peak)</option>
              <option value="Winter">Winter</option>
              <option value="Monsoon">Monsoon</option>
              <option value="Standard">Standard</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-primary simulate-btn" onClick={handleGeneratePlan} disabled={loading}>
            {loading ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            {loading ? 'Simulating Plan...' : 'Generate Production Plan'}
          </button>
        </div>
      </div>

      {/* ── ANIMATED KPI CARDS ─────────────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Production Required</span>
            <Factory size={20} color={agent.accent} />
          </div>
          <div className="kpi-value">{plan.production_quantity.toLocaleString()} <small>units</small></div>
          <div className="kpi-sub">Formula: Demand ({Number(forecastDemand).toLocaleString()}) - Inv ({Number(currentInventory).toLocaleString()}) + Safety ({Number(safetyStock).toLocaleString()})</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Production Timeline</span>
            <Clock size={20} color="#38bdf8" />
          </div>
          <div className="kpi-value">{plan.production_days} <small>days</small></div>
          <div className="kpi-sub">Capacity: {Number(dailyCapacity).toLocaleString()} units/day</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Capacity Utilization</span>
            <Gauge size={20} color="#a855f7" />
          </div>
          <div className="kpi-value">{plan.capacity_utilization}</div>
          <div className="kpi-progress-bar">
            <span style={{ width: plan.capacity_utilization, background: agent.accent }} />
          </div>
          <div className="kpi-sub">Target Efficiency: 85% - 98%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Priority & Risk</span>
            <AlertTriangle size={20} color={plan.priority === 'CRITICAL' ? '#f43f5e' : '#f59e0b'} />
          </div>
          <div className="kpi-value" style={{ color: plan.priority === 'CRITICAL' ? '#f43f5e' : '#00f5ff' }}>
            {plan.priority}
          </div>
          <div className="kpi-sub">Supplier Delay: {supplierDelay ? `${delayDays} days` : 'None'}</div>
        </div>
      </div>

      {/* ── MACHINE SCHEDULE TABLE & UTILIZATION GAUGE ────────────────── */}
      <div className="grid">
        <div className="card span-8">
          <div className="card-title">
            <Cpu size={18} color={agent.accent} /> Machine Allocation Schedule
          </div>
          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Daily Allocation</th>
                  <th>Total Assignment</th>
                  <th>Shift Hours</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plan.machine_schedule.map((m, idx) => (
                  <tr key={idx}>
                    <td><strong>{m.machine}</strong></td>
                    <td>{m.allocated.toLocaleString()} units/day</td>
                    <td>{(m.allocated * plan.production_days).toLocaleString()} units</td>
                    <td>{m.shift_hours || 8.0} hrs/shift</td>
                    <td>
                      <div className="util-badge">
                        <span>{m.utilization || 98}%</span>
                        <div className="util-mini-bar"><span style={{ width: `${m.utilization || 98}%`, background: agent.accent }} /></div>
                      </div>
                    </td>
                    <td><span className="status-badge status-online">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card span-4">
          <div className="card-title">
            <AlertTriangle size={18} color="#f43f5e" /> Bottlenecks & Risk Alerts
          </div>
          <div className="bottleneck-list">
            {plan.bottlenecks && plan.bottlenecks.map((b, i) => (
              <div className="bottleneck-item" key={i}>
                <AlertTriangle size={16} color="#f43f5e" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="optimization-box" style={{ borderColor: `${agent.accent}44` }}>
            <strong>Machine Optimization:</strong>
            <p>{plan.optimized_usage}</p>
          </div>
        </div>
      </div>

      {/* ── PRODUCTION CHARTS & TIMELINE ──────────────────────────── */}
      <div className="grid">
        <div className="card span-8">
          <div className="card-title">
            <TrendingUp size={18} color="#00f5ff" /> Planned Output vs Capacity Benchmark
          </div>
          <AgentChart
            agent={{
              id: 'production-sim',
              accent: '#00f5ff',
              series: chartSeries,
              seriesLabels: { primary: 'Max Capacity', secondary: 'Planned Output' },
            }}
            height={260}
          />
        </div>

        <div className="card span-4">
          <div className="card-title">
            <Calendar size={18} color="#38bdf8" /> Production Calendar Milestones
          </div>
          <div className="timeline-list">
            <div className="timeline-item">
              <span className="timeline-dot active" />
              <div>
                <strong>Day 1 - 2: Setup & Calibration</strong>
                <p>Tooling alignment for {product} on {numMachines} machines.</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-dot active" />
              <div>
                <strong>Day 3 - 8: Full Scale Run</strong>
                <p>Producing {Number(dailyCapacity).toLocaleString()} units/day at {plan.capacity_utilization} utilization.</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-dot" />
              <div>
                <strong>Day 9 - 10: Final Assembly & QC</strong>
                <p>Quality check and transfer to warehouse for shipping.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
