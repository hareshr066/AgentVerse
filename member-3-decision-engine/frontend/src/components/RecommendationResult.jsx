import React from 'react';
import {
  Brain, ShieldAlert, Factory, Package, Truck,
  AlertOctagon, CheckCircle2, Sparkles,
} from 'lucide-react';

const RISK_CONFIG = {
  Critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: AlertOctagon, label: 'CRITICAL' },
  High:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: ShieldAlert,  label: 'HIGH' },
  Medium:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: ShieldAlert,  label: 'MEDIUM' },
  Low:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2, label: 'LOW' },
};

function RecommendationCard({ icon: Icon, title, text, color }) {
  return (
    <div className="rec-card" style={{ borderLeftColor: color }}>
      <div className="rec-card-header" style={{ color }}>
        <Icon size={16} /> {title}
      </div>
      <p className="rec-card-text">{text}</p>
    </div>
  );
}

export default function RecommendationResult({ data }) {
  if (!data) return null;

  const risk = RISK_CONFIG[data.risk] || RISK_CONFIG.Medium;
  const RiskIcon = risk.icon;

  return (
    <div className="result-panel">
      {/* Header */}
      <div className="result-header">
        <Brain size={18} color="#8b5cf6" />
        <span>AI Recommendation Report</span>
        {data.ai_enhanced && (
          <span className="ai-badge"><Sparkles size={11} /> Gemini Enhanced</span>
        )}
        <span className="priority-badge" style={{ background: risk.bg, color: risk.color, marginLeft: 'auto' }}>
          <RiskIcon size={12} /> {risk.label} RISK
        </span>
      </div>

      {/* Executive summary */}
      <div className="exec-summary">
        <div className="exec-summary-label">Executive Summary</div>
        <p>{data.executive_summary}</p>
      </div>

      {/* Risk factors */}
      {data.risk_factors?.length > 0 && (
        <div className="risk-factors-wrap">
          <div className="risk-factors-title" style={{ color: risk.color }}>
            <RiskIcon size={14} /> Risk Factors Identified
          </div>
          <div className="risk-factors-list">
            {data.risk_factors.map((f, i) => (
              <div key={i} className="risk-factor-chip" style={{ borderColor: `${risk.color}40`, color: risk.color }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation cards */}
      <div className="rec-cards-grid">
        <RecommendationCard
          icon={Factory} title="Production" text={data.production} color="#3b82f6" />
        <RecommendationCard
          icon={Package} title="Inventory" text={data.inventory} color="#8b5cf6" />
        <RecommendationCard
          icon={Truck} title="Supplier" text={data.supplier} color="#14b8a6" />
      </div>
    </div>
  );
}
