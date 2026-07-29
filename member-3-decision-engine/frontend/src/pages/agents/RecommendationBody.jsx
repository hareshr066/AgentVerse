import React, { useState } from 'react';
import { Sparkles, Send, RefreshCw, Inbox } from 'lucide-react';
import { recommendationDetail } from '../../data/agentDetails.jsx';

const answer =
  'AI Optimization Plan:\n\n1. Inventory buffers are healthy for standard ops, but critical micro-controllers show 18-day lead times.\n2. Line 3 (Packaging) is near peak utilization (92%) — a bottleneck risk.\n3. Actions: re-route secondary assembly flow to Line 4 and reorder 500 sensor units via the pre-approved local channel immediately.';

export default function RecommendationBody({ agent }) {
  const [messages, setMessages] = useState([
    { role: 'user', text: recommendationDetail.presets[0] },
    { role: 'ai', text: 'Current inventory represents ~2 days of runway. Demand is expected to rise 25% due to seasonal automotive orders. Recommendation: scale Line 2 to 90% and initiate steel-coil procurement via pre-approved local channels.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', text: answer }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="grid">
      <div className="card span-8 copilot-card">
        <div className="card-title"><Sparkles size={18} color={agent.accent} className="anim-sparkle" /> Gemini Copilot</div>
        <div className="chat">
          {messages.map((m, i) => (
            <div className={`bubble ${m.role}`} key={i}>{m.text}</div>
          ))}
          {loading && <div className="bubble ai typing"><RefreshCw size={14} className="spin" /> Thinking…</div>}
        </div>
        <div className="preset-chips">
          {recommendationDetail.presets.map((p) => (
            <button key={p} className="preset-chip" onClick={() => send(p)}>{p.slice(0, 42)}…</button>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={input}
            placeholder="Ask the Gemini copilot…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn-primary" onClick={() => send()} disabled={loading}>
            <Send size={15} /> Send
          </button>
        </div>
      </div>

      <div className="card span-4">
        <div className="card-title"><Inbox size={18} color={agent.accent} /> Recommendations Feed</div>
        <div className="rec-feed">
          {recommendationDetail.feed.map((r) => (
            <div className="rec-item" key={r.title} style={{ '--tone': r.tone }}>
              <div className="rec-top">
                <span className="rec-impact">{r.impact} impact</span>
                <span className="rec-status">{r.status}</span>
              </div>
              <p>{r.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
