import React from 'react';
import { CheckCircle2, Clock, Gauge, Tag, Server } from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';

const PRIORITY_COLOR = { CRITICAL: '#f43f5e', HIGH: '#f59e0b', NORMAL: '#10b981' };
const PRIORITY_BG    = { CRITICAL: 'rgba(244,63,94,0.12)', HIGH: 'rgba(245,158,11,0.12)', NORMAL: 'rgba(16,185,129,0.12)' };

function KpiCard({ icon: Icon, label, value, sub, color = '#3b82f6' }) {
  return (
    <div className="kpi-card" style={{ borderColor: `${color}30` }}>
      <div className="kpi-icon" style={{ background: `${color}18`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="custom-tooltip">
      <p className="ct-title">{d.machine_id}</p>
      <p>Units: <strong>{d.assigned_units.toLocaleString()}</strong></p>
      <p>Shift Hrs: <strong>{d.shift_hours}h</strong></p>
      <p>Utilization: <strong>{d.utilization_percent}%</strong></p>
    </div>
  );
};

export default function ProductionResult({ data }) {
  if (!data) return null;

  const utilNum = parseFloat(data.capacity_utilization);
  const radialData = [{ name: 'Utilization', value: Math.min(utilNum, 100), fill: utilNum >= 95 ? '#f43f5e' : utilNum >= 80 ? '#f59e0b' : '#10b981' }];
  const pColor = PRIORITY_COLOR[data.priority] || '#3b82f6';
  const pBg    = PRIORITY_BG[data.priority]    || 'rgba(59,130,246,0.12)';

  return (
    <div className="result-panel">
      <div className="result-header">
        <CheckCircle2 size={18} color="#10b981" />
        <span>Production Plan — <strong>{data.product}</strong></span>
        <span className="priority-badge" style={{ background: pBg, color: pColor }}>
          {data.priority}
        </span>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        <KpiCard icon={Tag}   label="Production Qty"  value={data.production_quantity.toLocaleString()} sub="units" color="#3b82f6" />
        <KpiCard icon={Clock} label="Production Days" value={data.production_days} sub="working days" color="#8b5cf6" />
        <KpiCard icon={Gauge} label="Cap. Utilization" value={data.capacity_utilization} color={utilNum >= 95 ? '#f43f5e' : utilNum >= 80 ? '#f59e0b' : '#10b981'} />
        <KpiCard icon={Server} label="Machines" value={data.machine_schedule.length} sub="active" color="#14b8a6" />
      </div>

      <div className="charts-row">
        {/* Radial capacity gauge */}
        <div className="chart-box chart-box-sm">
          <div className="chart-box-title">Capacity Load</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="90%"
              startAngle={210} endAngle={-30} data={radialData}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.04)' }} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                fill={radialData[0].fill} fontSize={22} fontWeight={700}>
                {data.capacity_utilization}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Machine schedule bar chart */}
        <div className="chart-box chart-box-lg">
          <div className="chart-box-title">Machine Schedule — Units Assigned</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.machine_schedule} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="machine_id" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="assigned_units" radius={[6,6,0,0]}>
                {data.machine_schedule.map((m, i) => (
                  <Cell key={i} fill={['#3b82f6','#8b5cf6','#14b8a6','#f59e0b','#f43f5e','#10b981'][i % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine table */}
      <div className="machine-table-wrap">
        <table className="machine-table">
          <thead>
            <tr>
              <th>Machine</th>
              <th>Assigned Units</th>
              <th>Shift Hours</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {data.machine_schedule.map((m, i) => {
              const u = m.utilization_percent;
              const uColor = u >= 95 ? '#f43f5e' : u >= 80 ? '#f59e0b' : '#10b981';
              return (
                <tr key={i}>
                  <td><span className="machine-id-badge">{m.machine_id}</span></td>
                  <td>{m.assigned_units.toLocaleString()}</td>
                  <td>{m.shift_hours}h</td>
                  <td>
                    <div className="util-bar-wrap">
                      <div className="util-bar-track">
                        <div className="util-bar-fill" style={{ width: `${Math.min(u, 100)}%`, background: uColor }} />
                      </div>
                      <span style={{ color: uColor, fontWeight: 600 }}>{u}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="result-message">{data.message}</p>
    </div>
  );
}
