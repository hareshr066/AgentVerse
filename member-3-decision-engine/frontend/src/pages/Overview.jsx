import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ShieldAlert, BarChart3, ArrowRight, Cpu, Layers,
} from 'lucide-react';
import { agents, pipeline, platformFeatures, agentMap } from '../data/agents.jsx';
import { AgentChart } from '../components/widgets.jsx';

const overviewSeries = [
  { name: '08:00', primary: 120, secondary: 100 },
  { name: '10:00', primary: 150, secondary: 130 },
  { name: '12:00', primary: 180, secondary: 160 },
  { name: '14:00', primary: 210, secondary: 200 },
  { name: '16:00', primary: 190, secondary: 190 },
  { name: '18:00', primary: 140, secondary: 150 },
  { name: '20:00', primary: 110, secondary: 120 },
];

const warnings = [
  { level: 'high', title: 'Low Stock: Silicon Sensors', text: 'Inventory at 45 units (threshold 100). Lead time 14 days.' },
  { level: 'warn', title: 'Line 3 Maintenance Window', text: 'Scheduled maintenance opens in 4 hours. Throughput may scale down.' },
];

export default function Overview() {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">Multi-Agent Manufacturing Intelligence</span>
          <h1>Command Center</h1>
          <p>
            Six specialized AI agents collaborating in real time — from telemetry
            ingestion to Gemini-powered optimization. One pipeline, end to end.
          </p>
          <div className="hero-actions">
            <Link to="/agents/recommendation" className="btn-primary">
              <Layers size={16} /> Open Gemini Copilot
            </Link>
            <a href="#agents" className="btn-ghost">Explore agents <ArrowRight size={15} /></a>
          </div>
        </div>
        <div className="hero-stats">
          {[
            { k: '6', v: 'Active Agents' },
            { k: '88.4%', v: 'OEE' },
            { k: '12.4k', v: 'Events / min' },
            { k: '81%', v: 'Rec. Adoption' },
          ].map((s) => (
            <div key={s.v} className="hero-stat">
              <strong>{s.k}</strong>
              <span>{s.v}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid">
        <div className="card span-8">
          <div className="card-title"><BarChart3 size={18} color="#8b5cf6" /> Demand vs. Production</div>
          <AgentChart
            agent={{ id: 'overview', accent: '#8b5cf6', series: overviewSeries,
              seriesLabels: { primary: 'Demand', secondary: 'Production' } }}
            height={280}
          />
        </div>

        <div className="card span-4">
          <div className="card-title"><ShieldAlert size={18} color="#f43f5e" /> Active Warnings</div>
          <div className="warnings">
            {warnings.map((w) => (
              <div key={w.title} className={`warning ${w.level}`}>
                <h4>{w.title}</h4>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
          <div className="telemetry-mini">
            <div><span>Material Waste</span><b style={{ color: '#10b981' }}>1.2%</b></div>
            <div><span>Open Incidents</span><b style={{ color: '#10b981' }}>0</b></div>
          </div>
        </div>
      </div>

      <section id="agents" className="section-head">
        <h2><Cpu size={20} /> The Agent Fleet</h2>
        <p>Each agent owns a stage of the pipeline. Open any card for its dedicated console.</p>
      </section>

      <div className="agent-grid">
        {agents.map((a) => {
          const Icon = a.icon;
          return (
            <Link to={`/agents/${a.id}`} key={a.id} className={`agent-card card-anim-${a.anim}`}
              style={{ '--accent': a.accent }}>
              <div className="agent-card-glow" />
              <div className="agent-card-top">
                <div className="agent-icon" style={{ background: `${a.accent}1a`, color: a.accent }}>
                  <Icon size={22} className={`agent-anim anim-${a.anim}`} />
                </div>
                <span className="status-badge status-online">Online</span>
              </div>
              <h3>{a.name}</h3>
              <p className="agent-tagline">{a.tagline}</p>
              <div className="agent-card-metrics">
                {a.metrics.slice(0, 2).map((m) => (
                  <div key={m.label}>
                    <strong style={{ color: a.accent }}>{m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
              <span className="agent-card-owner">{a.owner}</span>
              <span className="agent-card-link">Open console <ArrowRight size={15} /></span>
            </Link>
          );
        })}
      </div>

      <div className="card span-12">
        <div className="card-title"><Activity size={18} color="#10b981" /> Multi-Agent Collaboration Pipeline</div>
        <div className="pipeline">
          {pipeline.map((p, i) => {
            const a = agentMap[p.agent];
            const Icon = a.icon;
            return (
              <React.Fragment key={p.step}>
                <Link to={`/agents/${a.id}`} className="pipeline-step" style={{ '--accent': a.accent }}>
                  <div className="pipeline-icon" style={{ background: `${a.accent}1a`, color: a.accent }}>
                    <Icon size={18} className={`agent-anim anim-${a.anim}`} />
                  </div>
                  <span className="pipeline-label">{p.label}</span>
                  <span className="pipeline-text">{p.text}</span>
                </Link>
                {i < pipeline.length - 1 && <ArrowRight className="pipeline-arrow" size={18} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <section className="section-head">
        <h2><Layers size={20} /> Platform Features</h2>
      </section>
      <div className="feature-grid">
        {platformFeatures.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="feature-card">
              <div className="feature-icon"><Icon size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
