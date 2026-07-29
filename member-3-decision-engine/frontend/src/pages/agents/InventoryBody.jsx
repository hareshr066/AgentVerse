import React from 'react';
import { Gauge, Boxes, Warehouse, AlertTriangle } from 'lucide-react';
import { inventoryDetail } from '../../data/agentDetails.jsx';

function pct(onHand, threshold) {
  return Math.min(100, Math.round((onHand / (threshold * 2)) * 100));
}

export default function InventoryBody({ agent }) {
  const runways = [
    { label: 'Avg Runway', value: 9.4, unit: 'days', ring: 47 },
    { label: 'Critical SKUs', value: 2, unit: 'items', ring: 20 },
    { label: 'Fill Rate', value: 96, unit: '%', ring: 96 },
  ];

  return (
    <>
      <div className="gauge-row">
        {runways.map((g) => (
          <div className="card gauge-card" key={g.label}>
            <div
              className="gauge"
              style={{ '--accent': agent.accent, '--val': g.ring }}
            >
              <span>{g.value}<small>{g.unit}</small></span>
            </div>
            <p>{g.label}</p>
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="card span-8">
          <div className="card-title"><Boxes size={18} color={agent.accent} /> Stock Levels vs. Threshold</div>
          <div className="stock-list">
            {inventoryDetail.stock.map((s) => {
              const low = s.onHand < s.threshold;
              return (
                <div className="stock-row" key={s.name}>
                  <div className="stock-name">
                    {low && <AlertTriangle size={14} className="stock-warn" />}
                    {s.name}
                  </div>
                  <div className="stock-track">
                    <span className="stock-thresh" style={{ left: `${pct(s.threshold, s.threshold)}%` }} />
                    <span
                      className="stock-fill"
                      style={{ width: `${pct(s.onHand, s.threshold)}%`, background: low ? '#f43f5e' : agent.accent }}
                    />
                  </div>
                  <div className="stock-num">{s.onHand.toLocaleString()} <small>{s.unit}</small></div>
                </div>
              );
            })}
          </div>
          <p className="legend"><span className="legend-thresh" /> reorder threshold</p>
        </div>

        <div className="card span-4">
          <div className="card-title"><Warehouse size={18} color={agent.accent} /> Warehouse Fill</div>
          <div className="wh-list">
            {inventoryDetail.warehouses.map((w) => (
              <div className="wh-item" key={w.code}>
                <div className="wh-top"><b>{w.code}</b><span>{w.name}</span><em>{w.fill}%</em></div>
                <div className="wh-bar"><span style={{ width: `${w.fill}%`, background: agent.accent }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
