import React from 'react';
import { 
  Home, 
  Newspaper, 
  LineChart, 
  Archive, 
  Truck, 
  Factory, 
  Sparkles, 
  Database,
  RefreshCw
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, statuses, onRefresh, refreshing }) {
  const menuItems = [
    { id: 'dashboard', label: 'Pipeline Gateway', icon: Home, agent: null },
    { id: 'event', label: '1. Event Intelligence', icon: Newspaper, agent: 'event' },
    { id: 'demand', label: '2. Demand Forecast', icon: LineChart, agent: 'demand' },
    { id: 'inventory', label: '3. Inventory Manager', icon: Archive, agent: 'inventory' },
    { id: 'supply', label: '4. Supply Procurement', icon: Truck, agent: 'supply' },
    { id: 'production', label: '5. Production Planner', icon: Factory, agent: 'production' },
    { id: 'recommendation', label: '6. Strategic Gemini', icon: Sparkles, agent: 'recommendation' },
    { id: 'history', label: 'Database Explorer', icon: Database, agent: null },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 100 100" className="floating-logo">
            <defs>
              <filter id="logo-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="30" fill="#3186FF" opacity="0.35" filter="url(#logo-blur)" />
            <circle cx="45" cy="40" r="15" fill="#FC413D" opacity="0.8" />
            <circle cx="60" cy="45" r="18" fill="#FFE432" opacity="0.8" />
            <circle cx="50" cy="60" r="16" fill="#00B95C" opacity="0.8" />
          </svg>
          <span className="brand-text">ManuSphere</span>
        </div>
        <span className="brand-sub">ANTIGRAVITY EDITION</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const status = item.agent ? statuses[item.agent] : null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-left">
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </div>
              {status && (
                <span className={`status-dot ${status}`} title={`Agent: ${status}`} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-health">
          <div className="health-header">
            <span>Agent Engine</span>
            <button 
              onClick={onRefresh} 
              disabled={refreshing}
              className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
              title="Refresh health status"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="health-grid">
            {Object.entries(statuses).map(([name, val]) => (
              <div key={name} className="health-row">
                <span className="agent-name">{name}</span>
                <span className={`health-badge ${val}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
