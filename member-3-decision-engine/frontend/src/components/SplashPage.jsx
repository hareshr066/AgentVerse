import React, { useState, useEffect } from 'react';
import InteractiveParticles from './InteractiveParticles.jsx';
import LiquidButton from './LiquidButton.jsx';
import { ArrowDown } from 'lucide-react';

export default function SplashPage({ onEnter }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 800); // match slide-up CSS transition time
  };

  // Automatically enter if user scrolls down / scrolls mouse wheel
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 20) {
        handleEnter();
      }
    };

    const handleTouchStart = (e) => {
      const touchY = e.touches[0].clientY;
      const handleTouchMove = (evt) => {
        const diffY = touchY - evt.touches[0].clientY;
        if (diffY > 40) {
          handleEnter();
          window.removeEventListener('touchmove', handleTouchMove);
        }
      };
      window.addEventListener('touchmove', handleTouchMove);
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div 
      className={`welcome-splash ${isExiting ? 'exit-slide' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        transition: 'transform 800ms cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      <InteractiveParticles />
      
      <div className="splash-content">
        <h1 className="splash-title">ManuSphere AI</h1>
        <p className="splash-subtitle">
          Multi-Agent Manufacturing Intelligence Command Center. Real-time telemetry ingestion,
          pipeline orchestrations, and Gemini-powered decision optimizations.
        </p>
        
        <LiquidButton onClick={handleEnter}>
          Enter Command Center <ArrowDown size={18} />
        </LiquidButton>
      </div>
    </div>
  );
}
