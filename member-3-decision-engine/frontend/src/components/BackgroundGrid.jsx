import React from 'react';

export default function BackgroundGrid() {
  return (
    <div className="background-container">
      {/* Mesh Grid Lines */}
      <div className="grid-overlay" />

      {/* Ethereal Glow Blobs */}
      <div className="glow-blob glow-yellow" />
      <div className="glow-blob glow-red" />
      <div className="glow-blob glow-green" />
      <div className="glow-blob glow-blue" />
    </div>
  );
}
