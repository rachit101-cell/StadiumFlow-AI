import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageProgressBar — sweeps a gradient bar across the top during route transitions.
 * Fixed at top: 56px (below the 14-unit app bar).
 */
export const PageProgressBar = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="page-progress-bar"
      style={{
        position: 'fixed',
        top: '56px',
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 9999,
        background: 'linear-gradient(90deg, #3B82F6, #14B8A6)',
        animation: 'page-progress 0.55s ease-out forwards',
        transformOrigin: 'left center',
      }}
    />
  );
};
