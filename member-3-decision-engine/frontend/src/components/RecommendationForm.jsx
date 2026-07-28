import React, { useState } from 'react';
import { Brain, ChevronRight, RotateCcw, Package, Truck, Cpu } from 'lucide-react';

const DEFAULTS = {
  // demand
  product: 'Air Conditioner',
  forecast_demand: 12000,
  forecast_period_days: 30,
  // inventory
  current_inventory: 4500,
  safety_stock: 1000,
  reorder_point: 2000,
  inventory_status: 'LOW',
  // supply
  supplier_delay: true,
  delay_days: 4,
  supplier_reliability: 0.85,
  // production (filled from production plan result or manually)
  production_quantity: 8500,
  production_days: 9.44,
  capacity_utilization: '100.00%',
  priority: 'HIGH',
};

function Field({ label, hint, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}{hint && <span className="form-hint">{hint}</span>}</label>
      {children}
    </div>
  );
}

export default function RecommendationForm({ onSubmit, loading, productionResult }) {
  const [form, setForm] = useState({
    ...DEFAULTS,
    ...(productionResult ? {
      product: productionResult.product,
      production_quantity: productionResult.production_quantity,
      production_days: productionResult.production_days,
      capacity_utilization: productionResult.capacity_utilization,
      priority: productionResult.priority,
    } : {}),
  });

  // Sync production fields when productionResult changes
  React.useEffect(() => {
    if (productionResult) {
      setForm((f) => ({
        ...f,
        product: productionResult.product,
        production_quantity: productionResult.production_quantity,
        production_days: productionResult.production_days,
        capacity_utilization: productionResult.capacity_utilization,
        priority: productionResult.priority,
      }));
    }
  }, [productionResult]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      demand: {
        product: form.product,
        forecast_demand: Number(form.forecast_demand),
        forecast_period_days: Number(form.forecast_period_days) || null,
      },
      inventory: {
        current_inventory: Number(form.current_inventory),
        safety_stock: Number(form.safety_stock),
        reorder_point: Number(form.reorder_point) || null,
        inventory_status: form.inventory_status || null,
      },
      supply: {
        supplier_delay: form.supplier_delay,
        delay_days: form.supplier_delay ? Number(form.delay_days) : 0,
        supplier_reliability: form.supplier_reliability ? Number(form.supplier_reliability) : null,
      },
      production: {
        production_quantity: Number(form.production_quantity),
        production_days: Number(form.production_days),
        capacity_utilization: form.capacity_utilization,
        priority: form.priority,
      },
    });
  };

  const reset = () => setForm(DEFAULTS);

  return (
    <form className="agent-form" onSubmit={handleSubmit} noValidate>

      {/* Demand */}
      <div className="form-section-title"><Package size={15} /> Demand Data</div>
      <div className="form-row-2">
        <Field label="Product">
          <input className="form-input" value={form.product} onChange={(e) => set('product', e.target.value)} />
        </Field>
        <Field label="Forecast Period" hint="days">
          <input type="number" className="form-input" value={form.forecast_period_days} min={1}
            onChange={(e) => set('forecast_period_days', e.target.value)} />
        </Field>
      </div>
      <Field label="Forecast Demand" hint="units">
        <input type="number" className="form-input" value={form.forecast_demand} min={1}
          onChange={(e) => set('forecast_demand', e.target.value)} />
      </Field>

      {/* Inventory */}
      <div className="form-section-title" style={{ marginTop: '1.25rem' }}><Package size={15} /> Inventory Data</div>
      <div className="form-row-2">
        <Field label="Current Inventory" hint="units">
          <input type="number" className="form-input" value={form.current_inventory} min={0}
            onChange={(e) => set('current_inventory', e.target.value)} />
        </Field>
        <Field label="Safety Stock" hint="units">
          <input type="number" className="form-input" value={form.safety_stock} min={0}
            onChange={(e) => set('safety_stock', e.target.value)} />
        </Field>
      </div>
      <div className="form-row-2">
        <Field label="Reorder Point" hint="units">
          <input type="number" className="form-input" value={form.reorder_point} min={0}
            onChange={(e) => set('reorder_point', e.target.value)} />
        </Field>
        <Field label="Inventory Status">
          <select className="form-input" value={form.inventory_status}
            onChange={(e) => set('inventory_status', e.target.value)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HEALTHY">HEALTHY</option>
          </select>
        </Field>
      </div>

      {/* Supply */}
      <div className="form-section-title" style={{ marginTop: '1.25rem' }}><Truck size={15} /> Supply Chain</div>
      <Field label="Supplier Delay">
        <div className="toggle-row">
          <button type="button" className={`toggle-btn ${!form.supplier_delay ? 'active-green' : ''}`}
            onClick={() => set('supplier_delay', false)}>No Delay</button>
          <button type="button" className={`toggle-btn ${form.supplier_delay ? 'active-rose' : ''}`}
            onClick={() => set('supplier_delay', true)}>Active Delay</button>
        </div>
      </Field>
      {form.supplier_delay && (
        <Field label="Delay Days" hint="days">
          <input type="number" className="form-input" value={form.delay_days} min={1}
            onChange={(e) => set('delay_days', e.target.value)} />
        </Field>
      )}
      <Field label="Supplier Reliability" hint="0.0 – 1.0">
        <input type="number" className="form-input" value={form.supplier_reliability}
          min={0} max={1} step={0.01}
          onChange={(e) => set('supplier_reliability', e.target.value)} />
      </Field>

      {/* Production data — pre-filled from plan if available */}
      <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
        <Cpu size={15} /> Production Data
        {productionResult && <span className="form-autofill-badge">Auto-filled from plan</span>}
      </div>
      <div className="form-row-2">
        <Field label="Production Quantity" hint="units">
          <input type="number" className="form-input" value={form.production_quantity} min={1}
            onChange={(e) => set('production_quantity', e.target.value)} />
        </Field>
        <Field label="Production Days">
          <input type="number" className="form-input" value={form.production_days} min={0.1} step={0.01}
            onChange={(e) => set('production_days', e.target.value)} />
        </Field>
      </div>
      <div className="form-row-2">
        <Field label="Capacity Utilization" hint='e.g. "100.00%"'>
          <input className="form-input" value={form.capacity_utilization}
            onChange={(e) => set('capacity_utilization', e.target.value)} />
        </Field>
        <Field label="Priority">
          <select className="form-input" value={form.priority}
            onChange={(e) => set('priority', e.target.value)}>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </Field>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
        <button type="submit" className="btn-primary btn-ai" disabled={loading}>
          {loading
            ? <><span className="btn-spinner" /> Analyzing…</>
            : <><Brain size={15} /> Get AI Recommendation <ChevronRight size={15} /></>
          }
        </button>
      </div>
    </form>
  );
}
