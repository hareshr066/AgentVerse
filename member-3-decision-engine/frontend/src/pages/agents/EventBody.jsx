import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Radar, Activity, Server } from 'lucide-react';
import { AgentChart } from '../../components/widgets.jsx';
import { eventDetail } from '../../data/agentDetails.jsx';

const sampleLines = [
  { level: 'info', msg: 'Frame batch ingested from Line 1' },
  { level: 'warn', msg: 'Thermal drift on kiln sensor T-22' },
  { level: 'info', msg: 'Event enriched with asset metadata' },
  { level: 'error', msg: 'Dropped frame: checksum mismatch node CX-9' },
  { level: 'info', msg: 'Anomaly cleared on Press #7' },
];

function stamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export default function EventBody({ agent }) {
  const [log, setLog] = useState(eventDetail.log);
  const feedRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      const s = sampleLines[Math.floor(Math.random() * sampleLines.length)];
      setLog((prev) => [{ t: stamp(), ...s }, ...prev].slice(0, 40));
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <div className="ticker">
        {agent.metrics.map((m) => (
          <div className="ticker-item" key={m.label}>
            <span className="ticker-dot" style={{ background: agent.accent }} />
            <b>{m.value}</b> {m.label}
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="card span-8 term-card">
          <div className="card-title"><Terminal size={18} color={agent.accent} /> Live Event Stream</div>
          <div className="terminal" ref={feedRef}>
            {log.map((l, i) => (
              <div className={`term-line lvl-${l.level}`} key={`${l.t}-${i}`}>
                <span className="term-time">{l.t}</span>
                <span className="term-tag">{l.level.toUpperCase()}</span>
                <span className="term-msg">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card span-4">
          <div className="card-title"><Radar size={18} color={agent.accent} /> Anomaly Radar</div>
          <div className="radar-viz" style={{ '--accent': agent.accent }}>
            <span className="radar-ring r1" /><span className="radar-ring r2" /><span className="radar-ring r3" />
            <span className="radar-sweep" />
            <span className="radar-core">{eventDetail.anomalies.reduce((s, a) => s + a.count, 0)}</span>
          </div>
          <ul className="tone-list">
            {eventDetail.anomalies.map((a) => (
              <li key={a.name}>
                <span className="tone-dot" style={{ background: a.tone }} />
                {a.name}<b>{a.count}</b>
              </li>
            ))}
          </ul>
        </div>

        <div className="card span-8">
          <div className="card-title"><Activity size={18} color={agent.accent} /> Throughput vs. Anomalies</div>
          <AgentChart agent={agent} type="area" height={240} />
        </div>

        <div className="card span-4">
          <div className="card-title"><Server size={18} color={agent.accent} /> Connected Sources</div>
          <div className="src-list">
            {eventDetail.sources.map((s, i) => {
              const load = [72, 88, 64, 91, 40, 55][i] ?? 60;
              return (
                <div className="src-row" key={s}>
                  <span className="pulse-dot" style={{ background: agent.accent }} />
                  <span className="src-name">{s}</span>
                  <div className="src-bar"><span style={{ width: `${load}%`, background: agent.accent }} /></div>
                  <small>{load}%</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
