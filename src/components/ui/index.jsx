import React, { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/* ============================================================
   ANIMATED NUMBER — spring-based counter
   ============================================================ */
export { AnimatedNumber } from './AnimatedNumber';

/* ============================================================
   CONGESTION METER
   ============================================================ */
const getCongestionMeta = (v) => {
  if (v >= 81) return { color: 'var(--status-danger)',  text: 'var(--status-danger)',  classes: 'congestion-bar-fill-critical', glow: 'rgba(239,68,68,0.4)' };
  if (v >= 66) return { color: 'var(--status-warning)', text: 'var(--status-warning)', classes: 'congestion-bar-fill-high', glow: 'rgba(249,115,22,0.3)' };
  if (v >= 41) return { color: 'var(--status-caution)', text: 'var(--status-caution)', classes: '', glow: 'transparent' };
  return         { color: 'var(--status-safe)',    text: 'var(--status-safe)',    classes: '', glow: 'transparent' };
};

export const CongestionMeter = memo(function CongestionMeter({ value, label, className }) {
  const meta = getCongestionMeta(value);
  return (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-widest)',
              color: 'var(--text-muted)',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 700,
              color: meta.text,
            }}
          >
            {value}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${value}%` : `Congestion: ${value}%`}
        style={{
          height: '5px',
          background: 'var(--bg-elevated)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          className={meta.classes}
          style={{
            height: '100%',
            borderRadius: '3px',
            backgroundColor: meta.color,
            boxShadow: `0 0 8px ${meta.glow}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  );
});

CongestionMeter.propTypes = {
  value:     PropTypes.number.isRequired,
  label:     PropTypes.string,
  className: PropTypes.string,
};
CongestionMeter.defaultProps = {
  label:     '',
  className: '',
};

/* ============================================================
   STATUS BADGE — always icon + text (never color alone)
   ============================================================ */
const STATUS_MAP = {
  low:      { bg: 'var(--status-safe-bg)',    border: 'var(--status-safe-border)',    text: 'var(--status-safe)',    dot: 'var(--status-safe)',    label: 'Low' },
  safe:     { bg: 'var(--status-safe-bg)',    border: 'var(--status-safe-border)',    text: 'var(--status-safe)',    dot: 'var(--status-safe)',    label: 'Safe' },
  caution:  { bg: 'var(--status-caution-bg)', border: 'var(--status-caution-border)', text: 'var(--status-caution)', dot: 'var(--status-caution)', label: 'Caution' },
  medium:   { bg: 'var(--status-caution-bg)', border: 'var(--status-caution-border)', text: 'var(--status-caution)', dot: 'var(--status-caution)', label: 'Medium' },
  warning:  { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', text: 'var(--status-warning)', dot: 'var(--status-warning)', label: 'Warning' },
  high:     { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', text: 'var(--status-warning)', dot: 'var(--status-warning)', label: 'High' },
  danger:   { bg: 'var(--status-danger-bg)',  border: 'var(--status-danger-border)',  text: 'var(--status-danger)',  dot: 'var(--status-danger)',  label: 'Danger' },
  critical: { bg: 'var(--status-danger-bg)',  border: 'var(--status-danger-border)',  text: 'var(--status-danger)',  dot: 'var(--status-danger)',  label: 'Critical' },
};

export const StatusBadge = memo(function StatusBadge({ status, label, icon, className }) {
  const c = STATUS_MAP[status] || STATUS_MAP.low;
  const displayLabel = label || c.label;
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-[5px] ${className}`}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '6px',
        padding: '3px 8px',
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        color: c.text,
      }}
    >
      {icon ? (
        <span className="material-symbols-rounded" style={{ fontSize: '12px' }} aria-hidden="true">{icon}</span>
      ) : (
        <span
          style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.dot, flexShrink: 0 }}
          aria-hidden="true"
        />
      )}
      {displayLabel}
      <span className="sr-only">{`— Congestion status: ${displayLabel}`}</span>
    </span>
  );
});

StatusBadge.propTypes = {
  status:    PropTypes.oneOf(['low', 'safe', 'caution', 'medium', 'warning', 'high', 'danger', 'critical']),
  label:     PropTypes.string,
  icon:      PropTypes.string,
  className: PropTypes.string,
};
StatusBadge.defaultProps = {
  status:    'low',
  label:     null,
  icon:      null,
  className: '',
};

/* ============================================================
   AI BADGE — for Gemini-generated content
   ============================================================ */
export const AIBadge = memo(function AIBadge({ className }) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label="AI-generated content"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(20,184,166,0.08))',
        border: '1px solid var(--ai-border)',
        borderRadius: '6px',
        padding: '2px 6px',
        fontFamily: 'var(--font-body)',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        color: 'var(--accent-blue-bright)',
      }}
    >
      <span style={{ fontSize: '10px' }} aria-hidden="true">✦</span> AI
    </span>
  );
});

AIBadge.propTypes = {
  className: PropTypes.string,
};
AIBadge.defaultProps = {
  className: '',
};

/* ============================================================
   BUTTON — 5 variants × 3 sizes, full state coverage
   ============================================================ */
const BTN_SIZES = {
  sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
  md: { height: '40px', padding: '0 18px', fontSize: '13px' },
  lg: { height: '48px', padding: '0 24px', fontSize: '14px' },
};

const BTN_VARIANTS = {
  primary: {
    style: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 60%, #1D4ED8 100%)',
      border: '1px solid rgba(96,165,250,0.3)',
      color: '#ffffff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
    },
    extraClass: 'btn-primary',
  },
  secondary: {
    style: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      color: 'var(--text-primary)',
    },
    extraClass: '',
  },
  ghost: {
    style: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-secondary)',
    },
    extraClass: '',
  },
  danger: {
    style: {
      background: 'var(--status-danger-bg)',
      border: '1px solid var(--status-danger-border)',
      color: 'var(--status-danger)',
    },
    extraClass: 'btn-danger-pulse',
  },
  icon: {
    style: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      color: 'var(--text-primary)',
    },
    extraClass: '',
    isIcon: true,
  },
  outline: {
    style: {
      background: 'transparent',
      border: '1px solid var(--border-default)',
      color: 'var(--text-primary)',
    },
    extraClass: '',
  },
};

export const Button = memo(function Button({
  children,
  variant,
  size,
  onClick,
  className,
  type,
  disabled,
  loading,
  leftIcon,
  style: extraStyle,
  ...props
}) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const s = BTN_SIZES[size] || BTN_SIZES.md;
  const isIcon = v.isIcon;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: s.height,
    width: isIcon ? s.height : undefined,
    padding: isIcon ? 0 : s.padding,
    fontSize: s.fontSize,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    borderRadius: isIcon ? '10px' : 'var(--card-radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 200ms ease-out',
    userSelect: 'none',
    textDecoration: 'none',
    ...v.style,
    ...extraStyle,
  };

  if (variant === 'ghost') {
    baseStyle.padding = isIcon ? 0 : (size === 'sm' ? '0 8px' : size === 'lg' ? '0 20px' : '0 14px');
  }

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileTap={disabled ? {} : { scale: 0.97 }}
      whileHover={disabled ? {} : { y: variant === 'primary' ? -1 : 0 }}
      className={`${v.extraClass} ${className}`}
      style={baseStyle}
      aria-busy={loading}
      aria-disabled={disabled}
      {...props}
    >
      {loading ? (
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ animation: 'spin 0.8s linear infinite' }}
          aria-hidden="true"
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
          <path d="M8 2A6 6 0 0114 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <>
          {leftIcon && (
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {children}
        </>
      )}
    </motion.button>
  );
});

Button.propTypes = {
  children:  PropTypes.node,
  variant:   PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'icon', 'outline']),
  size:      PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick:   PropTypes.func,
  className: PropTypes.string,
  type:      PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled:  PropTypes.bool,
  loading:   PropTypes.bool,
  leftIcon:  PropTypes.string,
  style:     PropTypes.object,
};
Button.defaultProps = {
  children:  null,
  variant:   'primary',
  size:      'md',
  onClick:   undefined,
  className: '',
  type:      'button',
  disabled:  false,
  loading:   false,
  leftIcon:  null,
  style:     {},
};

/* ============================================================
   CARD — standard | accent | status | glass
   ============================================================ */
export const Card = memo(function Card({
  children,
  variant,
  statusColor,
  glass,
  hover,
  className,
  role: roleProp,
  'aria-label': ariaLabel,
  style: extraStyle,
  ...props
}) {
  const baseStyle = {
    borderRadius: 'var(--card-radius)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 150ms ease',
  };

  let variantStyle = {};
  let variantClass = 'card-shimmer-top';

  if (glass) {
    variantStyle = {
      background: 'rgba(20,30,48,0.75)',
      backdropFilter: 'blur(32px) saturate(200%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--card-radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
      padding: 'var(--space-5)',
    };
    variantClass = '';
  } else if (variant === 'accent') {
    variantStyle = {
      background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(20,184,166,0.04) 100%)',
      border: '1px solid var(--border-emphasis)',
      padding: 'var(--space-5)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.25)',
    };
    variantClass = 'card-shimmer-top card-accent card-accent-bar';
  } else if (variant === 'status' && statusColor) {
    variantStyle = {
      background: `${statusColor}0D`,
      border: `1px solid ${statusColor}33`,
      borderLeft: `3px solid ${statusColor}`,
      padding: 'var(--space-5)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
    };
    variantClass = '';
  } else {
    variantStyle = {
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      padding: 'var(--space-5)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.25)',
    };
    variantClass = 'card-shimmer-top';
  }

  return (
    <div
      role={roleProp}
      aria-label={ariaLabel}
      className={`${variantClass} ${hover && !glass ? 'hover:scale-[1.002]' : ''} ${className}`}
      style={{ ...baseStyle, ...variantStyle, ...extraStyle }}
      {...props}
    >
      {children}
    </div>
  );
});

Card.propTypes = {
  children:    PropTypes.node,
  variant:     PropTypes.oneOf(['standard', 'accent', 'status', 'glass']),
  statusColor: PropTypes.string,
  glass:       PropTypes.bool,
  hover:       PropTypes.bool,
  className:   PropTypes.string,
  role:        PropTypes.string,
  'aria-label': PropTypes.string,
  style:       PropTypes.object,
};
Card.defaultProps = {
  children:    null,
  variant:     'standard',
  statusColor: null,
  glass:       false,
  hover:       true,
  className:   '',
  role:        'region',
  'aria-label': undefined,
  style:       undefined,
};

/* ============================================================
   FILTER CHIP — for category filtering
   ============================================================ */
export const FilterChip = memo(function FilterChip({ label, icon, selected, onClick, className }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-1.5 shrink-0 transition-all duration-150 focus-ring ${className}`}
      style={{
        background: selected ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
        border: selected ? '1px solid var(--accent-blue)' : '1px solid var(--border-default)',
        borderRadius: 'var(--chip-radius)',
        padding: '6px 14px',
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        fontWeight: 600,
        color: selected ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
        cursor: 'pointer',
      }}
      aria-pressed={selected}
    >
      {selected && icon && (
        <span className="material-symbols-rounded" style={{ fontSize: '14px' }} aria-hidden="true">{icon}</span>
      )}
      {label}
    </button>
  );
});

FilterChip.propTypes = {
  label:     PropTypes.string.isRequired,
  icon:      PropTypes.string,
  selected:  PropTypes.bool,
  onClick:   PropTypes.func,
  className: PropTypes.string,
};
FilterChip.defaultProps = {
  icon:      null,
  selected:  false,
  onClick:   undefined,
  className: '',
};

/* ============================================================
   QUICK ACTION CHIP — for chatbot prompt chips
   ============================================================ */
export const QuickActionChip = memo(function QuickActionChip({ label, onClick, className }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center gap-1.5 shrink-0 transition-all duration-150 focus-ring ${className}`}
      style={{
        background: hovered ? 'var(--accent-teal-dim)' : 'var(--bg-elevated)',
        border: hovered ? '1px solid var(--accent-teal)' : '1px solid var(--border-default)',
        borderRadius: 'var(--chip-radius)',
        padding: '0 14px',
        height: '32px',
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        fontWeight: 500,
        color: hovered ? 'var(--accent-teal-bright)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {label}
      <span
        className="material-symbols-rounded"
        style={{
          fontSize: '14px',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-4px)',
          transition: 'opacity 150ms ease, transform 150ms ease',
        }}
        aria-hidden="true"
      >
        arrow_forward
      </span>
    </button>
  );
});

QuickActionChip.propTypes = {
  label:     PropTypes.string.isRequired,
  onClick:   PropTypes.func,
  className: PropTypes.string,
};
QuickActionChip.defaultProps = {
  onClick:   undefined,
  className: '',
};

/* ============================================================
   SKELETON LOADER
   ============================================================ */
export const SkeletonLoader = memo(function SkeletonLoader({ className, style }) {
  return (
    <div
      className={`skeleton-premium ${className}`}
      aria-hidden="true"
      role="presentation"
      style={style}
    />
  );
});

SkeletonLoader.propTypes = {
  className: PropTypes.string,
  style:     PropTypes.object,
};
SkeletonLoader.defaultProps = {
  className: '',
  style:     {},
};

/* ============================================================
   SKELETON CARD — gate card shape
   ============================================================ */
export const SkeletonGateCard = memo(function SkeletonGateCard() {
  return (
    <div
      className="skeleton-premium"
      style={{
        borderRadius: 'var(--card-radius)',
        height: '240px',
        width: '100%',
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
});

/* ============================================================
   SKELETON ROUTE CARD
   ============================================================ */
export const SkeletonRouteCard = memo(function SkeletonRouteCard() {
  return (
    <div
      style={{
        borderRadius: 'var(--card-radius)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
      aria-hidden="true"
      role="presentation"
    >
      <SkeletonLoader style={{ height: '16px', width: '40%', borderRadius: '4px' }} />
      <SkeletonLoader style={{ height: '60px', borderRadius: '8px' }} />
      <SkeletonLoader style={{ height: '14px', width: '70%', borderRadius: '4px' }} />
    </div>
  );
});

/* ============================================================
   TOGGLE SWITCH — premium toggle, not a checkbox
   ============================================================ */
export const Toggle = memo(function Toggle({ checked, onChange, label, description, id }) {
  return (
    <div
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      tabIndex={0}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
      className="flex items-center justify-between cursor-pointer focus-ring"
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--card-radius-sm)',
        border: `1px solid ${checked ? 'var(--border-emphasis)' : 'var(--border-subtle)'}`,
        background: checked ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
        transition: 'all 200ms ease',
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {description}
          </div>
        )}
      </div>
      <div
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          background: checked ? 'var(--accent-blue)' : 'var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          transition: 'background 200ms ease',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#ffffff',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform 200ms ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
});

Toggle.propTypes = {
  checked:     PropTypes.bool.isRequired,
  onChange:    PropTypes.func.isRequired,
  label:       PropTypes.string.isRequired,
  description: PropTypes.string,
  id:          PropTypes.string,
};
Toggle.defaultProps = {
  description: null,
  id:          undefined,
};
