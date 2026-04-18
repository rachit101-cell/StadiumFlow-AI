import React, { useEffect, useRef } from 'react';

/**
 * VantaHero — full-viewport NET background loaded lazily.
 * Requires three.js + vanta CDN scripts in index.html:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"></script>
 */
const VantaHero = () => {
  const containerRef = useRef(null);
  const effectRef = useRef(null);

  /* --- Reduced-motion guard --- */
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) return;

    const VANTA = window.VANTA;
    if (!VANTA || !containerRef.current) return;

    effectRef.current = VANTA.NET({
      el: containerRef.current,
      THREE: window.THREE,
      mouseControls: true,
      touchControls: false,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x2563eb,
      backgroundColor: 0x080b12,
      points: 9.0,
      maxDistance: 20.0,
      spacing: 17.0,
    });

    /* Page Visibility API — pause when tab is hidden */
    const handleVisibility = () => {
      if (!effectRef.current) return;
      if (document.hidden) {
        effectRef.current.pause?.();
      } else {
        effectRef.current.restart?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      effectRef.current?.destroy?.();
      effectRef.current = null;
    };
  }, [prefersReduced]);

  if (prefersReduced) {
    /* Static gradient fallback */
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(37,99,235,0.18), transparent 70%), #080B12',
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Vanta canvas mount point */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Bottom fade to body color */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, #080B12)',
        }}
      />

      {/* Floating orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />
    </div>
  );
};

export default VantaHero;
