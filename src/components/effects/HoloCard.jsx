import React, { useCallback } from 'react';

/**
 * HoloCard — holographic shimmer wrapper.
 * Tracks mouse position and exposes --mouse-x / --mouse-y CSS vars.
 * Layout-neutral: no sizing, padding, or margin added.
 */
export const HoloCard = ({ children, className = '', ...props }) => {
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    e.currentTarget.style.setProperty('--mouse-x', '50%');
    e.currentTarget.style.setProperty('--mouse-y', '50%');
  }, []);

  return (
    <div
      className={`holo-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
      {...props}
    >
      {children}
      {/* Shimmer overlay — pointer-events-none so children remain interactive */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 2,
          background:
            'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(96,165,250,0.15) 0%, transparent 60%)',
          opacity: 0,
          transition: 'opacity 0.2s ease',
        }}
        className="holo-shimmer"
      />
    </div>
  );
};
