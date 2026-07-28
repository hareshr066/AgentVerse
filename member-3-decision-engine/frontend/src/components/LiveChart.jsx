import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, Pause, Play } from 'lucide-react';

function generatePoint(prev) {
  const now = new Date();
  const label = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const last = prev[prev.length - 1] || { Demand: 120, Production: 110, Inventory: 380 };
  const jitter = (range) => Math.round((Math.random() - 0.5) * range);
  return {
    time: label,
    Demand: Math.max(50, last.Demand + jitter(40)),
    Production: Math.max(40, last.Production + jitter(35)),
    Inventory: Math.max(50, last.Inventory + jitter(25)),
  };
}

const SEED = [
  { time: '–6s', Demand: 120, Production: 100, Inventory: 400 },
  { time: '–5s', Demand: 145, Production: 130, Inventory: 385 },
  { time: '–4s', Demand: 165, Production: 155, Inventory: 370 },
  { time: '–3s', Demand: 180, Production: 170, Inventory: 360 },
  { time: '–2s', Demand: 160, Production: 165, Inventory: 355 },
  { time: '–1s', Demand: 175, Production: 160, Inventory: 350 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="ct-title">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function LiveChart() {
  const [data, setData] = useState(SEED);
  const [running, setRunning] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setData((prev) => {
        const next = [...prev, generatePoint(prev)];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });
    }, 1500);
    return () => clearInterval(ref.current);
  }, [running]);

  return (
    <div className="live-chart-wrap">
      <div className="chart-toolbar">
        <div className="chart-box-title"><Activity size={15} color="#14b8a6" /> Live Telemetry Feed</div>
        <button className="icon-btn" onClick={() => setRunning((r) => !r)} title={running ? 'Pause' : 'Resume'}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>{running ? 'Pause' : 'Resume'}</span>
        </button>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gDemand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gProduction" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gInventory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tick={{ fill: '#6b7280' }} />
          <YAxis stroke="#4b5563" fontSize={11} tick={{ fill: '#6b7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#9ca3af' }} />
          <Area type="monotone" dataKey="Demand" stroke="#3b82f6" strokeWidth={2} fill="url(#gDemand)" dot={false} />
          <Area type="monotone" dataKey="Production" stroke="#8b5cf6" strokeWidth={2} fill="url(#gProduction)" dot={false} />
          <Area type="monotone" dataKey="Inventory" stroke="#14b8a6" strokeWidth={2} fill="url(#gInventory)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
