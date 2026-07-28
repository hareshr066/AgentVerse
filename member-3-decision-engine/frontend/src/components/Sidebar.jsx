import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Cpu, X, ChevronDown, Bot } from 'lucide-react';
import { agents } from '../data/agents.jsx';

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const onAgentRoute = location.pathname.startsWith('/agents/');
  const [agentsOpen, setAgentsOpen] = useState(onAgentRoute);

  // Auto-expand the group whenever we navigate to an agent page.
  React.useEffect(() => {
    if (onAgentRoute) setAgentsOpen(true);
  }, [onAgentRoute]);

  return (
    <>
      <div className={`sidebar-scrim ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><Cpu size={20} /></div>
          <div>
            <h1>ManuSphere<span>AI</span></h1>
            <p>Manufacturing Intelligence</p>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section">Platform</span>
          <NavLink to="/" end className="nav-link" onClick={onClose}>
            <LayoutDashboard size={18} />
            <span>Command Center</span>
          </NavLink>

          <span className="nav-section">Workspace</span>
          <button
            type="button"
            className={`nav-link nav-group-toggle ${onAgentRoute ? 'active-parent' : ''}`}
            onClick={() => setAgentsOpen((v) => !v)}
            aria-expanded={agentsOpen}
          >
            <Bot size={18} />
            <span>Agents</span>
            <span className="nav-count">6</span>
            <ChevronDown size={16} className={`nav-chevron ${agentsOpen ? 'open' : ''}`} />
          </button>

          <div className={`nav-group ${agentsOpen ? 'open' : ''}`}>
            <div className="nav-group-inner">
              {agents.map((a) => {
                const Icon = a.icon;
                return (
                  <NavLink
                    key={a.id}
                    to={`/agents/${a.id}`}
                    className="nav-link nav-sublink"
                    onClick={onClose}
                  >
                    <Icon size={16} className={`nav-anim anim-${a.anim}`} style={{ color: a.accent }} />
                    <span>{a.short}</span>
                    <span className="nav-dot" style={{ background: a.accent }} />
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-status">
            <span className="pulse-dot" /> All systems operational
          </div>
          <p>6 agents · Orchestrator online</p>
        </div>
      </aside>
    </>
  );
}
