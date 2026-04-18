import { useRef, useEffect, useState } from 'react';

/**
 * useMagneticEffect — pulls a button toward the cursor when within 80px.
 * No-op on touch devices.
 * Returns { ref, magneticStyle, glowOpacity }
 */
export function useMagneticEffect(radius = 80) {
  const ref = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [glowOpacity, setGlowOpacity] = useState(0.35);

  /* Touch guard */
  const isTouch =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches;

  /* Reduced motion guard */
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (isTouch || prefersReduced) return;

    const handleMove = (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        const pull = 1 - dist / radius;
        setTransform({
          x: dx * pull * 0.35,
          y: dy * pull * 0.35,
          scale: 1 + pull * 0.06,
        });
        setGlowOpacity(0.35 + pull * 0.35);
      } else {
        setTransform({ x: 0, y: 0, scale: 1 });
        setGlowOpacity(0.35);
      }
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isTouch, prefersReduced, radius]);

  const magneticStyle = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    transition: 'transform 0.18s cubic-bezier(0.23, 1, 0.32, 1)',
  };

  return { ref, magneticStyle, glowOpacity };
}
