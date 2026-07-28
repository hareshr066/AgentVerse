import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const agents = [
  { key: 'production', label: 'Production Agent', port: '8001' },
  { key: 'recommendation', label: 'Recommendation Agent', port: '8000' },
];

export default function AgentStatusBar({ statuses, onRefresh, refreshing }) {
  return (
    <div className="agent-status-bar">
      {agents.map((a) => {
        const s = statuses[a.key];
        const online = s === 'online';
        const checking = s === 'checking';
        return (
          <div key={a.key} className={`agent-pill ${online ? 'online' : checking ? 'checking' : 'offline'}`}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{a.label}</span>
            <span className="agent-pill-port">:{a.port}</span>
          </div>
        );
      })}
      <button className="icon-btn" onClick={onRefresh} disabled={refreshing} title="Refresh agent status">
        <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
      </button>
    </div>
  );
}
