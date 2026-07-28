import React, { useEffect } from 'react';

export default function Spotlight() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Find the mouse coordinates relative to the screen/document
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return null;
}
