import { useRef, useCallback, useEffect } from 'react';

/**
 * use3DTilt — returns { ref, style } for perspective tilt on mouse movement.
 * @param {'standard'|'accent'|'organizer'} variant
 */
const configs = {
  standard:  { maxTilt: 6,  perspective: 1000, scale: 1.02 },
  accent:    { maxTilt: 8,  perspective: 800,  scale: 1.03 },
  organizer: { maxTilt: 4,  perspective: 1200, scale: 1.015 },
};

export function use3DTilt(variant = 'standard') {
  const ref = useRef(null);
  const frameRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const cfg = configs[variant] || configs.standard;

  /* Reduced motion guard */
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applyTransform = useCallback((rotX, rotY, scale) => {
    if (!ref.current) return;
    ref.current.style.transform = `
      perspective(${cfg.perspective}px)
      rotateX(${rotX}deg)
      rotateY(${rotY}deg)
      scale(${scale})
    `;
    ref.current.style.transition = 'none';

    /* Specular highlight */
    const shine = ref.current.querySelector('.tilt-shine');
    if (shine) {
      const nx = (rotY / cfg.maxTilt) * 50 + 50;
      const ny = (-rotX / cfg.maxTilt) * 50 + 50;
      shine.style.background = `radial-gradient(circle at ${nx}% ${ny}%, rgba(255,255,255,0.08) 0%, transparent 65%)`;
    }
  }, [cfg]);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced) return;

    const handleMove = (e) => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const rotY = dx * cfg.maxTilt;
        const rotX = -dy * cfg.maxTilt;
        applyTransform(rotX, rotY, cfg.scale);
      });
    };

    const handleLeave = () => {
      cancelAnimationFrame(frameRef.current);
      leaveTimerRef.current = setTimeout(() => {
        if (!ref.current) return;
        ref.current.style.transition = 'transform 500ms cubic-bezier(0.23, 1, 0.32, 1)';
        ref.current.style.transform = `perspective(${cfg.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
        const shine = ref.current.querySelector('.tilt-shine');
        if (shine) shine.style.background = 'transparent';
      }, 50);
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(frameRef.current);
      clearTimeout(leaveTimerRef.current);
    };
  }, [applyTransform, cfg, prefersReduced]);

  return { ref };
}
