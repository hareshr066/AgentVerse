import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, RefreshCw, Trash2, Download, ShieldAlert,
  TrendingUp, Layers, CheckCircle2, AlertCircle, FileText, Cpu, HelpCircle
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Should I increase production?',
  'Is my inventory sufficient?',
  'Which supplier is risky?',
  'Can I meet next week\'s demand?',
  'Generate executive summary.',
  'Give production report.',
  'Suggest cost optimization.',
  'What are today\'s manufacturing risks?',
];

export default function RecommendationBody({ agent }) {
  // Manufacturing Context State
  const [context] = useState({
    product: 'Air Conditioner',
    forecastDemand: 12000,
    currentInventory: 4200,
    safetyStock: 1000,
    supplierDelay: true,
    delayDays: 4,
    dailyCapacity: 900,
    productionQuantity: 8800,
    productionDays: 10,
    capacityUtilization: '98%',
    riskLevel: 'High',
    priority: 'High',
    factoryStatus: 'HIGH DEMAND DEFICIT',
  });

  // Chat Conversation State
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Hello! I am your AI Manufacturing Consultant with 20+ years of manufacturing operations experience. How can I assist you with today\'s production planning and decision-making?',
      structured: {
        executive_summary: 'Demand is expected to increase significantly for Air Conditioners.',
        current_situation: 'Demand (12,000 units) exceeds current inventory (4,200 units) by 7,800 units with an active 4-day supplier delay.',
        production_analysis: 'Planned production of 8,800 units over 10 working days operating at 98% capacity utilization.',
        inventory_analysis: 'Inventory level (4,200 units) is low relative to forecast demand.',
        supply_chain_analysis: 'Active 4-day supplier delay detected; secondary supplier activation is recommended.',
        recommended_actions: [
          'Increase production by 20%.',
          'Increase safety stock.',
          'Use alternate supplier.'
        ],
        business_impact: 'High business impact: Mitigates potential revenue loss on 7,800 units and prevents stockouts.',
        risk: 'High',
        priority: 'High',
        confidence: '96%',
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Sending Chat Messages
  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    // Add user message
    const userMsg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const payload = {
      question: q,
      product: context.product,
      forecast: context.forecastDemand,
      inventory: context.currentInventory,
      safety_stock: context.safetyStock,
      supplier_delay: context.supplierDelay,
      delay_days: context.delayDays,
      production_quantity: context.productionQuantity,
      production_days: context.productionDays,
      capacity_utilization: context.capacityUtilization,
      priority: context.priority,
      risk_level: context.riskLevel,
    };

    try {
      const res = await fetch('http://localhost:8004/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: data.executive_summary || 'Executive Recommendation generated.',
            structured: data,
          }
        ]);
      } else {
        generateLocalAiResponse(q);
      }
    } catch (err) {
      generateLocalAiResponse(q);
    } finally {
      setLoading(false);
    }
  };

  // Local AI Response Generator (fallback with full context compliance)
  const generateLocalAiResponse = (q) => {
    const qLower = q.toLowerCase();
    let summary = 'Demand is expected to increase significantly.';
    let prodRec = 'Increase production by 20%.';
    let invRec = 'Increase safety stock.';
    let suppRec = 'Use alternate supplier.';

    if (qLower.includes('increase production')) {
      summary = 'Yes, increase production output by 20% immediately to cover the demand deficit.';
    } else if (qLower.includes('inventory sufficient')) {
      summary = 'No, current inventory (4,200 units) is insufficient to cover forecasted demand (12,000 units).';
    } else if (qLower.includes('supplier')) {
      summary = 'Primary supplier has an active delay of 4 days. Activating alternate Supplier B is recommended.';
    } else if (qLower.includes('risk')) {
      summary = 'Current manufacturing risk is High due to a 4-day supplier delay and low inventory buffer.';
    } else if (qLower.includes('meet next week')) {
      summary = 'Yes, by operating 2 machines at 98% capacity for 10 days, the factory will fulfill 8,800 units.';
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        text: summary,
        structured: {
          executive_summary: summary,
          current_situation: `Forecast demand (${context.forecastDemand.toLocaleString()} units) exceeds inventory (${context.currentInventory.toLocaleString()} units) by 7,800 units with an active ${context.delayDays}-day supplier delay.`,
          production_analysis: `Production run of ${context.productionQuantity.toLocaleString()} units scheduled over ${context.productionDays} days at ${context.capacityUtilization} capacity utilization.`,
          inventory_analysis: `Inventory level (${context.currentInventory.toLocaleString()} units) is low relative to safety stock buffer (${context.safetyStock.toLocaleString()} units).`,
          supply_chain_analysis: `Supplier delay of ${context.delayDays} days detected. Alternative procurement route advised.`,
          recommended_actions: [prodRec, invRec, suppRec],
          business_impact: 'High business impact: Prevents potential revenue loss on 7,800 units and avoids customer order cancellations.',
          risk: context.riskLevel,
          priority: context.priority,
          confidence: '96%',
        }
      }
    ]);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleExportReport = () => {
    const reportLines = [
      '==================================================',
      'MANUSPHERE AI — MANUFACTURING CONSULTANT REPORT',
      '==================================================',
      `Date: ${new Date().toLocaleString()}`,
      `Product: ${context.product}`,
      `Forecast Demand: ${context.forecastDemand.toLocaleString()} units`,
      `Current Inventory: ${context.currentInventory.toLocaleString()} units`,
      `Supplier Delay: ${context.supplierDelay ? `${context.delayDays} days` : 'None'}`,
      '--------------------------------------------------',
      '',
    ];

    messages.forEach((m, idx) => {
      reportLines.push(`[${m.role.toUpperCase()}] ${m.text}`);
      if (m.structured) {
        reportLines.push(`  Situation: ${m.structured.current_situation || ''}`);
        reportLines.push(`  Production: ${m.structured.production_analysis || ''}`);
        reportLines.push(`  Actions: ${m.structured.recommended_actions ? m.structured.recommended_actions.join(', ') : ''}`);
        reportLines.push(`  Impact: ${m.structured.business_impact || ''}`);
        reportLines.push(`  Risk: ${m.structured.risk || ''} | Priority: ${m.structured.priority || ''}`);
      }
      reportLines.push('');
    });

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Manufacturing_Consultant_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="copilot-page-layout">
      {/* ── CONTEXT HEADER STRIP ───────────────────────────────────── */}
      <div className="context-strip">
        <div className="context-strip-left">
          <Cpu size={16} color={agent.accent} />
          <span>Active Context: <strong>{context.product}</strong></span>
          <span className="dot-sep" />
          <span>Demand: <strong>{context.forecastDemand.toLocaleString()}</strong></span>
          <span className="dot-sep" />
          <span>Inv: <strong>{context.currentInventory.toLocaleString()}</strong></span>
          <span className="dot-sep" />
          <span>Delay: <strong>{context.supplierDelay ? `${context.delayDays} days` : 'No'}</strong></span>
        </div>
        <div className="context-strip-right">
          <button className="btn-ghost-sm" onClick={handleExportReport}>
            <Download size={14} /> Export Report
          </button>

          <button className="btn-ghost-sm" onClick={handleClearChat}>
            <Trash2 size={14} /> Clear Chat
          </button>
        </div>
      </div>

      <div className="grid">
        {/* ── CHAT INTERFACE (CHATGPT / COPILOT STYLE) ───────────────── */}
        <div className="card span-8 chat-assistant-card">
          <div className="card-title">
            <Sparkles size={18} color={agent.accent} className="anim-sparkle" />
            <span>AI Manufacturing Consultant Assistant</span>
            <span className="status-badge status-online" style={{ marginLeft: 'auto' }}>
              ● 20+ Yrs Contextual Engine Active
            </span>
          </div>

          <div className="chat-viewport">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.role}`}>
                <div className="chat-avatar">
                  {m.role === 'user' ? 'U' : <Sparkles size={14} />}
                </div>

                <div className="chat-content-box">
                  <div className="chat-text">{m.text}</div>

                  {/* Render Structured AI Consultant Report Cards if available */}
                  {m.role === 'ai' && m.structured && (
                    <div className="structured-report-card">
                      {m.structured.current_situation && (
                        <div className="report-sec">
                          <strong>Situation Analysis:</strong>
                          <p>{m.structured.current_situation}</p>
                        </div>
                      )}

                      {m.structured.production_analysis && (
                        <div className="report-sec">
                          <strong>Production Analysis:</strong>
                          <p>{m.structured.production_analysis}</p>
                        </div>
                      )}

                      {m.structured.recommended_actions && (
                        <div className="report-sec">
                          <strong>Recommended Actions:</strong>
                          <ul>
                            {m.structured.recommended_actions.map((act, aIdx) => (
                              <li key={aIdx}><CheckCircle2 size={14} color="#00f5ff" /> {act}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {m.structured.business_impact && (
                        <div className="report-sec impact-sec">
                          <strong>Business Impact:</strong>
                          <p>{m.structured.business_impact}</p>
                        </div>
                      )}

                      <div className="report-badges">
                        <span className="rep-badge badge-risk">Risk: <strong>{m.structured.risk || 'High'}</strong></span>
                        <span className="rep-badge badge-priority">Priority: <strong>{m.structured.priority || 'High'}</strong></span>
                        <span className="rep-badge badge-conf">AI Confidence: <strong>{m.structured.confidence || '96%'}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message ai loading">
                <div className="chat-avatar"><Sparkles size={14} /></div>
                <div className="chat-content-box typing-box">
                  <RefreshCw size={14} className="spin" />
                  <span>AI Consultant analyzing manufacturing telemetry context...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Questions Chips */}
          <div className="suggested-chips-container">
            <div className="suggested-label"><HelpCircle size={13} /> Suggested Questions:</div>
            <div className="suggested-chips">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} className="chip-btn" onClick={() => handleSend(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* User Input Controls */}
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input-field"
              value={input}
              placeholder="Ask the AI Manufacturing Consultant a question..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <button className="btn-primary send-btn" onClick={() => handleSend()} disabled={loading || !input.trim()}>
              <Send size={15} /> Send
            </button>
          </div>
        </div>

        {/* ── SIDE PANEL: RISK METER & EXECUTIVE IMPACT CARDS ────────── */}
        <div className="card span-4 copilot-side-panel">
          <div className="card-title">
            <ShieldAlert size={18} color="#f43f5e" /> Executive Dashboard Overview
          </div>

          {/* Risk Meter Gauge Card */}
          <div className="side-widget risk-meter-card">
            <div className="widget-label">Overall Risk Level</div>
            <div className="risk-level-badge risk-high">{context.riskLevel}</div>
            <div className="risk-bar-container">
              <span className="risk-bar-fill" style={{ width: '75%', background: '#f43f5e' }} />
            </div>
            <p className="widget-sub">Driven by 4-day active supplier delay & inventory deficit.</p>
          </div>

          {/* Business Impact Card */}
          <div className="side-widget impact-widget-card">
            <div className="widget-label"><TrendingUp size={16} color="#00f5ff" /> Business Impact</div>
            <div className="impact-text">
              High Business Impact: Prevents potential revenue loss on <strong>7,800 units</strong> while navigating supply chain constraints.
            </div>
          </div>

          {/* Quick Action Summary */}
          <div className="side-widget action-summary-card">
            <div className="widget-label"><Layers size={16} color={agent.accent} /> Priority Action Directives</div>
            <ul className="side-action-list">
              <li><CheckCircle2 size={14} color="#00f5ff" /> Increase production by 20%</li>
              <li><CheckCircle2 size={14} color="#00f5ff" /> Increase safety stock buffer</li>
              <li><CheckCircle2 size={14} color="#00f5ff" /> Activate alternate supplier B</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
