import React, { useState } from 'react';
import { Factory, Zap, AlertTriangle, ChevronRight, RotateCcw } from 'lucide-react';

const DEFAULTS = {
  product: 'Air Conditioner',
  forecast_demand: 12000,
  current_inventory: 4500,
  safety_stock: 1000,
  daily_capacity: 900,
  num_machines: 3,
  supplier_delay: false,
  delay_days: 0,
};

function Field({ label, hint, children }) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {hint && <span className="form-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function ProductionForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULTS);
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.product.trim()) e.product = 'Required';
    if (form.forecast_demand <= 0) e.forecast_demand = 'Must be > 0';
    if (form.current_inventory < 0) e.current_inventory = 'Must be ≥ 0';
    if (form.safety_stock < 0) e.safety_stock = 'Must be ≥ 0';
    if (form.daily_capacity <= 0) e.daily_capacity = 'Must be > 0';
    if (form.num_machines <= 0) e.num_machines = 'Must be > 0';
    if (form.supplier_delay && form.delay_days <= 0) e.delay_days = 'Must be > 0 when delay is active';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...form,
      forecast_demand: Number(form.forecast_demand),
      current_inventory: Number(form.current_inventory),
      safety_stock: Number(form.safety_stock),
      daily_capacity: Number(form.daily_capacity),
      num_machines: Number(form.num_machines),
      delay_days: form.supplier_delay ? Number(form.delay_days) : 0,
    });
  };

  const reset = () => { setForm(DEFAULTS); setErrors({}); };

  return (
    <form className="agent-form" onSubmit={handleSubmit} noValidate>
      <div className="form-section-title">
        <Factory size={16} /> Production Parameters
      </div>

      <Field label="Product Name">
        <input
          className={`form-input ${errors.product ? 'error' : ''}`}
          value={form.product}
          onChange={(e) => set('product', e.target.value)}
          placeholder="e.g. Air Conditioner"
        />
        {errors.product && <span className="form-error">{errors.product}</span>}
      </Field>

      <div className="form-row-2">
        <Field label="Forecast Demand" hint="units">
          <input type="number" className={`form-input ${errors.forecast_demand ? 'error' : ''}`}
            value={form.forecast_demand} min={1}
            onChange={(e) => set('forecast_demand', e.target.value)} />
          {errors.forecast_demand && <span className="form-error">{errors.forecast_demand}</span>}
        </Field>
        <Field label="Current Inventory" hint="units">
          <input type="number" className={`form-input ${errors.current_inventory ? 'error' : ''}`}
            value={form.current_inventory} min={0}
            onChange={(e) => set('current_inventory', e.target.value)} />
          {errors.current_inventory && <span className="form-error">{errors.current_inventory}</span>}
        </Field>
      </div>

      <div className="form-row-2">
        <Field label="Safety Stock" hint="units">
          <input type="number" className={`form-input ${errors.safety_stock ? 'error' : ''}`}
            value={form.safety_stock} min={0}
            onChange={(e) => set('safety_stock', e.target.value)} />
          {errors.safety_stock && <span className="form-error">{errors.safety_stock}</span>}
        </Field>
        <Field label="Daily Capacity" hint="units/day">
          <input type="number" className={`form-input ${errors.daily_capacity ? 'error' : ''}`}
            value={form.daily_capacity} min={1}
            onChange={(e) => set('daily_capacity', e.target.value)} />
          {errors.daily_capacity && <span className="form-error">{errors.daily_capacity}</span>}
        </Field>
      </div>

      <Field label="Number of Machines">
        <div className="machine-stepper">
          {[1,2,3,4,5,6].map((n) => (
            <button type="button" key={n}
              className={`stepper-btn ${form.num_machines === n ? 'active' : ''}`}
              onClick={() => set('num_machines', n)}>
              {n}
            </button>
          ))}
        </div>
      </Field>

      <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
        <AlertTriangle size={16} /> Supplier Status
      </div>

      <Field label="Supplier Delay">
        <div className="toggle-row">
          <button type="button"
            className={`toggle-btn ${!form.supplier_delay ? 'active-green' : ''}`}
            onClick={() => set('supplier_delay', false)}>
            No Delay
          </button>
          <button type="button"
            className={`toggle-btn ${form.supplier_delay ? 'active-rose' : ''}`}
            onClick={() => set('supplier_delay', true)}>
            Active Delay
          </button>
        </div>
      </Field>

      {form.supplier_delay && (
        <Field label="Delay Days" hint="days">
          <input type="number" className={`form-input ${errors.delay_days ? 'error' : ''}`}
            value={form.delay_days} min={1}
            onChange={(e) => set('delay_days', e.target.value)} />
          {errors.delay_days && <span className="form-error">{errors.delay_days}</span>}
        </Field>
      )}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? <><span className="btn-spinner" /> Generating…</>
            : <><Zap size={15} /> Generate Plan<ChevronRight size={15} /></>
          }
        </button>
      </div>
    </form>
  );
}
