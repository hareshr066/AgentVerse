import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, X } from 'lucide-react';
import { agents } from '../data/agents.jsx';

export default function Sidebar({ open, onClose }) {
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

          <span className="nav-section">Agents</span>
          {agents.map((a) => {
            const Icon = a.icon;
            return (
              <NavLink
                key={a.id}
                to={`/agents/${a.id}`}
                className="nav-link"
                onClick={onClose}
              >
                <Icon size={18} style={{ color: a.accent }} />
                <span>{a.short}</span>
                <span className="nav-dot" style={{ background: a.accent }} />
              </NavLink>
            );
          })}
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
