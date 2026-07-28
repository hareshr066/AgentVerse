import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { agentMap, agents } from '../data/agents.jsx';

import EventBody from './agents/EventBody.jsx';
import DemandBody from './agents/DemandBody.jsx';
import InventoryBody from './agents/InventoryBody.jsx';
import SupplyBody from './agents/SupplyBody.jsx';
import ProductionBody from './agents/ProductionBody.jsx';
import RecommendationBody from './agents/RecommendationBody.jsx';

const bodies = {
  event: EventBody,
  demand: DemandBody,
  inventory: InventoryBody,
  supply: SupplyBody,
  production: ProductionBody,
  recommendation: RecommendationBody,
};

export default function AgentDetail() {
  const { id } = useParams();
  const agent = agentMap[id];
  if (!agent) return <Navigate to="/" replace />;

  const Icon = agent.icon;
  const Body = bodies[id];
  const idx = agents.findIndex((a) => a.id === id);
  const next = agents[(idx + 1) % agents.length];

  return (
    <div className={`page agent-page theme-${id}`} style={{ '--accent': agent.accent }}>
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

      <Body agent={agent} />

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
