import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

export function MetricCard({ metric, accent }) {
  const showTrend = metric.trend && metric.trend.length > 0;
  return (
    <div className="metric-card">
      <span className="metric-label">{metric.label}</span>
      <span className="metric-value" style={{ color: accent }}>{metric.value}</span>
      {showTrend && (
        <span className={`metric-trend ${metric.positive ? 'up' : 'down'}`}>
          {metric.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {metric.trend}
        </span>
      )}
    </div>
  );
}

export function AgentChart({ agent, type = 'area', height = 260 }) {
  const { series, seriesLabels, accent } = agent;
  const secondary = '#64748b';
  const gid = `grad-${agent.id}`;

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} width={38} />
      <Tooltip
        contentStyle={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
        }}
      />
    </>
  );

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={series} barGap={4}>
            {axes}
            <Bar dataKey="primary" name={seriesLabels.primary} fill={accent} radius={[6, 6, 0, 0]} />
            <Bar dataKey="secondary" name={seriesLabels.secondary} fill={secondary} radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={series}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.45} />
                <stop offset="95%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area type="monotone" dataKey="primary" name={seriesLabels.primary}
              stroke={accent} strokeWidth={2} fillOpacity={1} fill={`url(#${gid})`} />
            <Area type="monotone" dataKey="secondary" name={seriesLabels.secondary}
              stroke={secondary} strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityFeed({ items, accent }) {
  return (
    <ul className="activity-feed">
      {items.map((it, i) => (
        <li key={i}>
          <span className="activity-dot" style={{ background: accent }} />
          <div>
            <p>{it.text}</p>
            <time>{it.time}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}
