import React, { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export default function SplineScene({ className }) {
  return (
    <div className={`spline-wrapper ${className || ''}`}>
      <Suspense fallback={<div className="spline-loading">Loading 3D Interface...</div>}>
        <Spline 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" 
          className="spline-canvas"
        />
      </Suspense>
    </div>
  );
}
