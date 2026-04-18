import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVenue } from '../../contexts/VenueContext';

const SEVERITY_MAP = {
  critical: { dot: 'var(--status-danger)',  border: 'var(--status-danger-border)',  bg: 'var(--status-danger-bg)',  cls: 'alert-critical' },
  high:     { dot: 'var(--status-warning)', border: 'var(--status-warning-border)', bg: 'var(--status-warning-bg)', cls: 'alert-chip-enter' },
  medium:   { dot: 'var(--status-caution)', border: 'var(--status-caution-border)', bg: 'var(--status-caution-bg)', cls: 'alert-chip-enter' },
  low:      { dot: 'var(--accent-blue)',    border: 'var(--border-emphasis)',        bg: 'var(--accent-blue-dim)',   cls: 'alert-chip-enter' },
};

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

export const AlertStrip = () => {
  const { venueState, dispatch } = useVenue();

  // Sort by severity then timestamp
  const sorted = [...venueState.activeAlerts].sort((a, b) => {
    const so = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
    if (so !== 0) return so;
    return a.timestamp - b.timestamp;
  });

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Live venue alerts"
      className="w-full flex items-center gap-2 py-2 px-6 scrollbar-hide overflow-x-auto"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-ghost)',
        minHeight: '40px',
      }}
    >
      <AnimatePresence mode="popLayout">
        {sorted.length === 0 ? (
          <motion.div
            key="all-clear"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="flex items-center gap-[6px] shrink-0"
            role="status"
            aria-label="No active alerts"
          >
            <span
              style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--status-safe)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              All clear — no active alerts
            </span>
          </motion.div>
        ) : (
          sorted.map(alert => {
            const s = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.low;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className={`flex items-center gap-[6px] shrink-0 ${s.cls}`}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 'var(--chip-radius)',
                  padding: '4px 10px 4px 8px',
                }}
              >
                <span
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {alert.message}
                </span>
                {alert.dismissible && (
                  <button
                    onClick={() => dispatch({ type: 'DISMISS_ALERT', payload: alert.id })}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    aria-label={`Dismiss: ${alert.message}`}
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                      aria-hidden="true"
                    >
                      close
                    </span>
                  </button>
                )}
                <span className="sr-only">{`${alert.severity} alert: ${alert.message}`}</span>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
};
