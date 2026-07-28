import React, { useState } from 'react';
import { LineChart as LineIcon, Table, FlaskConical, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AgentChart } from '../../components/widgets.jsx';
import { demandDetail } from '../../data/agentDetails.jsx';

export default function DemandBody({ agent }) {
  const [scenario, setScenario] = useState(1);

  return (
    <>
      <div className="card span-12">
        <div className="card-title"><LineIcon size={18} color={agent.accent} /> 14-Day Demand Forecast</div>
        <AgentChart agent={agent} type="area" height={300} />
      </div>

      <div className="grid">
        <div className="card span-7">
          <div className="card-title"><Table size={18} color={agent.accent} /> Per-SKU Projections</div>
          <table className="data-table">
            <thead>
              <tr><th>SKU</th><th>Next (units)</th><th>Δ vs. last</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              {demandDetail.skus.map((s) => (
                <tr key={s.sku}>
                  <td className="mono">{s.sku}</td>
                  <td>{s.next}</td>
                  <td className={s.change >= 0 ? 'pos' : 'neg'}>
                    {s.change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {Math.abs(s.change)}%
                  </td>
                  <td>
                    <div className="conf-bar"><span style={{ width: `${s.conf}%`, background: agent.accent }} /></div>
                    <small>{s.conf}%</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card span-5">
          <div className="card-title"><FlaskConical size={18} color={agent.accent} /> What-If Scenarios</div>
          <div className="scenario-list">
            {demandDetail.scenarios.map((sc, i) => (
              <button
                key={sc.name}
                className={`scenario ${scenario === i ? 'active' : ''}`}
                style={{ '--tone': sc.tone }}
                onClick={() => setScenario(i)}
              >
                <div className="scenario-head">
                  <strong>{sc.name}</strong>
                  <span className="scenario-uplift">{sc.uplift}</span>
                </div>
                <p>{sc.note}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
