import React from 'react';
import { Award, Truck, Clock, ShieldCheck } from 'lucide-react';
import { supplyDetail } from '../../data/agentDetails.jsx';

export default function SupplyBody({ agent }) {
  return (
    <div className="grid">
      <div className="card span-7">
        <div className="card-title"><Award size={18} color={agent.accent} /> Supplier Ranking</div>
        <div className="supplier-list">
          {supplyDetail.suppliers.map((s) => (
            <div className="supplier" key={s.name}>
              <div className="supplier-rank" style={{ background: `${agent.accent}1a`, color: agent.accent }}>
                #{s.rank}
              </div>
              <div className="supplier-body">
                <div className="supplier-top">
                  <strong>{s.name}</strong>
                  <span className="supplier-score" style={{ color: agent.accent }}>{s.score}</span>
                </div>
                <div className="score-track"><span style={{ width: `${s.score}%`, background: agent.accent }} /></div>
                <div className="supplier-meta">
                  <span><Clock size={13} /> {s.lead}d lead</span>
                  <span><ShieldCheck size={13} /> {s.reliability}% reliable</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card span-5">
        <div className="card-title"><Truck size={18} color={agent.accent} /> Purchase Order Timeline</div>
        <ol className="po-timeline">
          {supplyDetail.orders.map((o) => (
            <li key={o.id} style={{ '--tone': o.tone }}>
              <span className="po-node" />
              <div className="po-card">
                <div className="po-top"><b>{o.id}</b><span className="po-status">{o.status}</span></div>
                <p>{o.item}</p>
                <em>ETA: {o.eta}</em>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
