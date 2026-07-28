import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, Radio, Play, RefreshCw, ArrowRight,
} from 'lucide-react';
import { agentMap, agents } from '../data/agents.jsx';
import { MetricCard, AgentChart, ActivityFeed } from '../components/widgets.jsx';

function GeminiCopilot({ accent }) {
  const [prompt, setPrompt] = useState(
    'Analyze inventory and recommend optimization actions for peak-hour bottlenecks.'
  );
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState(
    'AI Insight: Current inventory represents ~2 days of runway. Demand is expected to rise 25% due to seasonal automotive orders.\n\nRecommendation: Scale Production Line 2 to 90% load and initiate procurement of primary raw steel coils via pre-approved local channels to mitigate container shipping delays.'
  );

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setRec(
        'AI Optimization Plan [Generated]:\n\n1. Inventory — buffers healthy for standard ops, but critical micro-controllers show 18-day lead times.\n2. Bottleneck — Line 3 (Packaging) near peak utilization (92%).\n3. Action — re-route secondary assembly flow to Line 4 to distribute packing load. Reorder 500 sensor units immediately.'
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="card span-12">
      <div className="card-title"><Radio size={18} color={accent} /> Gemini Intelligence Copilot</div>
      <div className="copilot">
        <div>
          <textarea className="prompt-area" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <button className="btn-primary copilot-btn" onClick={generate} disabled={loading}>
            {loading ? <RefreshCw className="spin" size={16} /> : <Play size={16} />}
            Generate AI Recommendation
          </button>
        </div>
        <div className="recommendation-box">{rec}</div>
      </div>
    </div>
  );
}

export default function AgentDetail() {
  const { id } = useParams();
  const agent = agentMap[id];
  if (!agent) return <Navigate to="/" replace />;

  const Icon = agent.icon;
  const idx = agents.findIndex((a) => a.id === id);
  const next = agents[(idx + 1) % agents.length];
  const chartType = ['production', 'supply'].includes(id) ? 'bar' : 'area';

  return (
    <div className="page">
      <Link to="/" className="back-link"><ChevronLeft size={16} /> Command Center</Link>

      <section className="agent-hero" style={{ '--accent': agent.accent }}>
        <div className="agent-hero-icon" style={{ background: `${agent.accent}1a`, color: agent.accent }}>
          <Icon size={34} className={`agent-anim-lg anim-${agent.anim}`} />
        </div>
        <div className="agent-hero-copy">
          <div className="agent-hero-top">
            <h1>{agent.name}</h1>
            <span className="status-badge status-online">● Online</span>
          </div>
          <p className="agent-hero-tagline">{agent.tagline}</p>
          <div className="agent-hero-meta">
            <span>{agent.owner}</span>
            <span className="dot-sep" />
            <code>:{agent.port}{agent.endpoint}</code>
          </div>
        </div>
      </section>

      <p className="agent-desc">{agent.description}</p>

      <div className="metric-row">
        {agent.metrics.map((m) => (
          <MetricCard key={m.label} metric={m} accent={agent.accent} />
        ))}
      </div>

      <div className="grid">
        <div className="card span-8">
          <div className="card-title" style={{ color: agent.accent }}>
            {agent.seriesLabels.primary} vs {agent.seriesLabels.secondary}
          </div>
          <AgentChart agent={agent} type={chartType} height={300} />
        </div>

        <div className="card span-4">
          <div className="card-title">Capabilities</div>
          <ul className="capability-list">
            {agent.capabilities.map((c) => (
              <li key={c}><CheckCircle2 size={16} style={{ color: agent.accent }} /> {c}</li>
            ))}
          </ul>
        </div>

        <div className="card span-12">
          <div className="card-title">Recent Activity</div>
          <ActivityFeed items={agent.activity} accent={agent.accent} />
        </div>
      </div>

      {agent.id === 'recommendation' && (
        <div className="grid"><GeminiCopilot accent={agent.accent} /></div>
      )}

      <Link to={`/agents/${next.id}`} className="next-agent" style={{ '--accent': next.accent }}>
        <div>
          <span>Next agent</span>
          <strong>{next.name}</strong>
        </div>
        <ArrowRight size={20} />
      </Link>
    </div>
  );
}
