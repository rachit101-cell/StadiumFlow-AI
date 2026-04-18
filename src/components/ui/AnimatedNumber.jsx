import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * AnimatedNumber — spring-animated counting number.
 * Flashes brightness on value change: brighter for increases, dimmer for decreases.
 */
export const AnimatedNumber = ({ value = 0, suffix = '' }) => {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 0.8 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  const prevRef = useRef(value);
  const [filter, setFilter] = useState('brightness(1)');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    mv.set(value);

    if (value !== prev) {
      const increased = value > prev;
      setFilter(increased ? 'brightness(1.5)' : 'brightness(0.7)');
      setScale(1.08);
      const t = setTimeout(() => {
        setFilter('brightness(1)');
        setScale(1);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [value, mv]);

  return (
    <motion.span
      style={{
        display: 'inline-block',
        filter,
        scale,
        transition: 'filter 0.3s ease, scale 0.15s ease',
      }}
    >
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
};
