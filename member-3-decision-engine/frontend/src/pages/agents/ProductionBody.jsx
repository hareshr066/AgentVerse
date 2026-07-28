import React from 'react';
import { Factory, ListChecks, Gauge } from 'lucide-react';
import { productionDetail } from '../../data/agentDetails.jsx';

const statusTone = {
  Running: '#10b981',
  Bottleneck: '#f43f5e',
  Maintenance: '#f59e0b',
};

export default function ProductionBody({ agent }) {
  return (
    <>
      <div className="card span-12">
        <div className="card-title"><Factory size={18} color={agent.accent} /> Line Utilization Control Room</div>
        <div className="line-board">
          {productionDetail.lines.map((l) => (
            <div className="line-col" key={l.name}>
              <div className="line-meter">
                <span
                  className="line-fill"
                  style={{ height: `${l.util}%`, background: statusTone[l.status] }}
                />
                <span className="line-util">{l.util}%</span>
              </div>
              <div className="line-name">{l.name}</div>
              <span className="line-status" style={{ color: statusTone[l.status] }}>{l.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid">
        <div className="card span-7">
          <div className="card-title"><ListChecks size={18} color={agent.accent} /> Job Queue</div>
          <div className="gantt">
            {productionDetail.jobs.map((j) => (
              <div className="gantt-row" key={j.job}>
                <div className="gantt-label">{j.job}<small>{j.line}</small></div>
                <div className="gantt-track">
                  <span className="gantt-bar" style={{ width: `${j.progress}%`, background: agent.accent }}>
                    {j.progress}%
                  </span>
                </div>
                <div className="gantt-eta">{j.eta}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card span-5">
          <div className="card-title"><Gauge size={18} color={agent.accent} /> OEE Breakdown</div>
          <div className="oee-list">
            {productionDetail.oee.map((o) => (
              <div className="oee-item" key={o.label}>
                <div className="oee-top"><span>{o.label}</span><b>{o.value}%</b></div>
                <div className="oee-bar"><span style={{ width: `${o.value}%`, background: agent.accent }} /></div>
              </div>
            ))}
            <div className="oee-total" style={{ borderColor: `${agent.accent}55` }}>
              <span>Overall OEE</span>
              <strong style={{ color: agent.accent }}>88.4%</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
