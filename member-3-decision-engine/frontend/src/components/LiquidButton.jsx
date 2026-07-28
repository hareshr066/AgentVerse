import React, { useState } from 'react';

export default function LiquidButton({ children, onClick, className = '' }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`liquid-btn-wrapper ${className}`}
      style={{
        transform: isPressed 
          ? 'translateY(1.5px) scale(0.97)' 
          : isHovered 
            ? 'translateY(-1px) scale(1.02)' 
            : 'translateY(0) scale(1)',
        transition: 'all 200ms cubic-bezier(0.1, 0.4, 0.2, 1)',
      }}
    >
      <div 
        className="liquid-btn-backdrop"
        style={{
          backdropFilter: 'url("#liquid-glass-filter") blur(6px)',
          WebkitBackdropFilter: 'url("#liquid-glass-filter") blur(6px)',
        }}
      />
      
      <button
        type="button"
        className="liquid-btn"
        onClick={onClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsPressed(false); setIsHovered(false); }}
      >
        {children}
      </button>
      
      {/* Self-contained distortion SVG filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="liquid-glass-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
