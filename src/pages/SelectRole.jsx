import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { Button } from '../components/ui';

const containerVariants = { animate: { transition: { staggerChildren: 0.12 } } };
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } },
};

const RoleCard = ({ onClick, accentColor, icon, title, desc, cta, ctaVariant = 'primary' }) => {
  const [hovered, setHovered] = React.useState(false);

  const isAmber = accentColor === 'var(--status-caution)';
  const borderColor = hovered
    ? (isAmber ? 'var(--status-caution-border)' : 'var(--border-active)')
    : 'var(--border-subtle)';
  const shadowGlow = hovered
    ? `0 8px 48px ${isAmber ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)'}, 0 2px 8px rgba(0,0,0,0.4)`
    : '0 2px 8px rgba(0,0,0,0.4)';

  return (
    <motion.div variants={cardVariants}>
      <div
        className="flex flex-col items-center text-center rounded-[20px] relative overflow-hidden cursor-pointer"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${borderColor}`,
          padding: '48px 36px',
          boxShadow: shadowGlow,
          transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
          transform: hovered ? 'translateY(-2px) scale(1.005)' : 'none',
        }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Continue as ${title}`}
      >
        {/* Radial hover glow */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 70% 60% at 50% 100%, ${isAmber ? 'rgba(245,158,11,0.07)' : 'rgba(59,130,246,0.06)'}, transparent)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 250ms ease',
          }}
          aria-hidden="true"
        />

        {/* Icon circle */}
        <div
          style={{
            width: '72px', height: '72px',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '28px',
            background: isAmber ? 'var(--status-caution-bg)' : 'var(--accent-blue-dim)',
            border: `1px solid ${isAmber ? 'var(--status-caution-border)' : 'var(--border-emphasis)'}`,
            transition: 'transform 200ms ease',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: '34px', color: accentColor }}
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-snug)',
            marginBottom: '12px',
            marginTop: 0,
          }}
        >
          {title}
        </h2>

        {/* Desc */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '32px',
            maxWidth: '280px',
            margin: '0 0 32px 0',
          }}
        >
          {desc}
        </p>

        <Button onClick={onClick} variant={ctaVariant} className="w-full" style={isAmber ? { color: 'var(--status-caution)', borderColor: 'var(--status-caution-border)', background: 'var(--status-caution-bg)' } : {}}>
          {cta}
        </Button>
      </div>
    </motion.div>
  );
};

export const SelectRole = () => {
  const navigate = useNavigate();
  const { loginAsOrganizer, loginAsAttendee } = useUser();

  const handleAttendee = () => { loginAsAttendee(); navigate('/onboarding'); };
  const handleOrganizer = () => { loginAsOrganizer(); navigate('/organizer'); };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Background radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.1), transparent)' }}
        aria-hidden="true"
      />
      {/* Grid */}
      <div className="absolute inset-0 hero-grid-bg pointer-events-none" style={{ opacity: 0.15 }} aria-hidden="true" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 mb-14 relative z-10"
      >
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M11 2L19.66 7V17L11 22L2.34 17V7L11 2Z" stroke="var(--accent-blue)" strokeWidth="1.5" fill="var(--accent-blue-dim)" />
          <path d="M8 11h2m0 0l2-2m-2 2l2 2" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          StadiumFlow<span style={{ color: 'var(--accent-blue)' }}>AI</span>
        </span>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center mb-12 relative z-10"
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 4vw, 34px)',
            fontWeight: 700,
            letterSpacing: 'var(--tracking-tight)',
            color: 'var(--text-primary)',
            marginBottom: '12px',
            margin: '0 0 12px 0',
          }}
        >
          Choose your portal
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
          How will you be experiencing the match today?
        </p>
      </motion.div>

      {/* Role cards */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid md:grid-cols-2 gap-5 w-full max-w-3xl relative z-10"
      >
        <RoleCard
          onClick={handleAttendee}
          accentColor="var(--accent-blue-bright)"
          icon="local_activity"
          title="I'm Attending"
          desc="Get smart gate guidance, live navigation, AI-powered queue help, and exit planning — all personalized to your seat."
          cta="Continue as Attendee"
          ctaVariant="primary"
        />
        <RoleCard
          onClick={handleOrganizer}
          accentColor="var(--status-caution)"
          icon="dashboard_customize"
          title="Venue Organizer"
          desc="Monitor zone health, detect bottlenecks, broadcast advisories, and coordinate your team with full AI operational support."
          cta="Enter Control Center"
          ctaVariant="secondary"
        />
      </motion.div>

      {/* Guest link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.3 }}
        onClick={handleAttendee}
        className="mt-6 focus-ring"
        style={{
          fontFamily: 'var(--font-body)', fontSize: '12px',
          color: 'var(--text-muted)',
          background: 'none', border: 'none', cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: '3px',
          transition: 'color 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        Continue as Guest
      </motion.button>

      {/* Gemini credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="flex items-center gap-1.5 mt-10 relative z-10"
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>Powered by Google Gemini</span>
      </motion.div>
    </div>
  );
};
