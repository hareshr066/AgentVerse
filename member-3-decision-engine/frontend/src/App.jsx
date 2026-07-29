import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Menu, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Overview from './pages/Overview.jsx';
import AgentDetail from './pages/AgentDetail.jsx';
import FloatingParticles from './components/FloatingParticles.jsx';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <FloatingParticles />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="app-main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar-title">ManuSphere AI</div>
          <div className="topbar-right">
            <span className="status-badge status-online">● Orchestrator Connected</span>
            <button className="btn-primary sync-btn">
              <RefreshCw size={15} /> Sync Pipeline
            </button>
          </div>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
