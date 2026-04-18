import React, { Suspense, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button, AIBadge } from '../components/ui';
import { use3DTilt } from '../hooks/use3DTilt';

const VantaHero = React.lazy(() => import('../components/effects/VantaHero'));

/* ── Animated chat demo loop ── */
const DEMO_CHAT_SEQUENCE = [
  { role: 'user', text: 'Which gate should I use?' },
  { role: 'ai', parts: { recommendation: 'Proceed to Gate C via East Walk', why: 'Gate A is 74% congested. Gate C reduces your wait by 12 minutes.', impact: 'Saves 12 min', backup: 'Gate D — 3 min longer walking, 8 min less queue' } },
];

const ChatDemoLoop = () => {
  const [phase, setPhase] = useState('typing'); // typing | response | wait
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => {
    let t1, t2, t3;
    const run = () => {
      setPhase('typing');
      setShowResponse(false);
      t1 = setTimeout(() => { setPhase('response'); }, 900);
      t2 = setTimeout(() => { setShowResponse(true); }, 2200);
      t3 = setTimeout(() => run(), 8000);
    };
    run();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-emphasis)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(59,130,246,0.08)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '15px', color: '#fff' }} aria-hidden="true">auto_awesome</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Assistant</span>
        </div>
        <AIBadge />
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '220px' }}>
        {/* User bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: 1.5,
            color: '#fff',
            background: 'linear-gradient(135deg, var(--accent-blue-muted), var(--accent-blue))',
            borderRadius: '16px 16px 4px 16px',
            padding: '10px 14px',
            maxWidth: '80%',
          }}>
            Which gate should I use?
          </div>
        </div>

        {/* Typing or response */}
        <AnimatePresence mode="wait">
          {phase === 'typing' && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px 16px 16px 16px',
                padding: '14px 18px',
                alignSelf: 'flex-start',
              }}
            >
              <div style={{ display: 'flex', gap: '5px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                ))}
              </div>
            </motion.div>
          )}
          {phase === 'response' && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px 16px 16px 16px',
                overflow: 'hidden',
                alignSelf: 'flex-start',
                width: '100%',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: '8px', right: '10px' }}><AIBadge /></div>
              <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--accent-blue)', borderBottom: '1px solid var(--border-ghost)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '3px' }}>Recommendation</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--accent-blue-bright)' }}>Proceed to Gate C via East Walk</div>
              </div>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-ghost)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '3px' }}>Why</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>Gate A is 74% congested. Gate C reduces your wait by 12 minutes.</div>
              </div>
              <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--accent-teal)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '3px' }}>Time Impact</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--accent-teal-bright)' }}>⏱ Saves 12 minutes</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Feature card with 3D tilt ── */
const FeatureTiltCard = ({ card }) => {
  const { ref } = use3DTilt('standard');
  return (
    <div
      ref={ref}
      className={`tilt-wrapper p-8 rounded-2xl relative overflow-hidden ${card.span}`}
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(20,184,166,0.04) 100%)',
        border: '1px solid var(--border-emphasis)',
      }}
    >
      <div className="tilt-shine" />
      <div
        style={{
          width: '44px', height: '44px',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${card.iconBg}`,
          marginBottom: '24px',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: '22px', color: card.color }} aria-hidden="true">{card.icon}</span>
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          letterSpacing: 'var(--tracking-normal)',
        }}
      >
        {card.title}
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
        {card.desc}
      </p>
    </div>
  );
};

const featureCards = [
  { icon: 'map',           color: 'var(--accent-blue)',  iconBg: 'var(--accent-blue-dim)',         span: 'md:col-span-2', title: 'Live Route Navigation',    desc: 'A custom interactive map that dynamically reroutes you around congestion bottlenecks in real time.' },
  { icon: 'meeting_room',  color: 'var(--accent-teal)',  iconBg: 'var(--accent-teal-dim)',         span: '',              title: 'Smart Gate Assignment',    desc: 'Directs you to the fastest entry point based on exact live crowd volume.' },
  { icon: 'accessible',    color: 'var(--status-caution)', iconBg: 'var(--status-caution-bg)',   span: '',              title: 'Accessibility First',      desc: 'Guaranteed stair-free routing for wheelchair users and those with limited mobility.' },
  { icon: 'query_stats',   color: 'var(--status-safe)',  iconBg: 'var(--status-safe-bg)',         span: 'md:col-span-2', title: 'Organizer Command Center', desc: 'Venue staff get a full operational overview with AI-generated recommendations to resolve bottlenecks before they become critical.' },
];

const MIN_DASHLINE = { textDecoration: 'none' };

export const Landing = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
  };

  const stagger = {
    animate: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] overflow-x-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ─── Navbar ─────────────────────────────────── */}
      <nav
        className="fixed w-full top-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: '64px',
          background: 'rgba(8,12,20,0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}
        >
          <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M11 2L19.66 7V17L11 22L2.34 17V7L11 2Z" stroke="var(--accent-blue)" strokeWidth="1.5" fill="var(--accent-blue-dim)" />
            <path d="M8 11h2m0 0l2-2m-2 2l2 2" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          StadiumFlow<span style={{ color: 'var(--accent-blue)' }}>AI</span>
        </div>

        {/* Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {['Attendee', 'Organizer', 'Features'].map(item => (
            <button
              key={item}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                position: 'relative',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-blue-bright)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              className="focus-ring"
            >
              {item}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/select-role')} className="hidden md:inline-flex">
            View Demo
          </Button>
          <Button onClick={() => navigate('/select-role')}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────── */}
      <section
        className="relative pt-24 pb-20 min-h-screen flex items-center overflow-hidden"
        style={{ paddingTop: '80px' }}
      >
        {/* Vanta background */}
        <Suspense fallback={null}>
          <VantaHero />
        </Suspense>
        {/* Grid overlay */}
        <div className="absolute inset-0 hero-grid-bg pointer-events-none" style={{ opacity: 0.25 }} aria-hidden="true" />
        {/* Floating orbs */}
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="hero-orb hero-orb-3" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left col — copy */}
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="flex flex-col items-start"
            >
              {/* Eyebrow */}
              <motion.div variants={fadeUp} className="mb-8">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    background: 'var(--accent-blue-dim)',
                    border: '1px solid var(--border-emphasis)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-widest)',
                    color: 'var(--accent-blue-bright)',
                  }}
                >
                  <span className="animate-pulse-live" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }} aria-hidden="true" />
                  Powered by Google Gemini · Live AI
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(40px, 5.5vw, 68px)',
                  fontWeight: 700,
                  letterSpacing: 'var(--tracking-tight)',
                  lineHeight: 1.1,
                  color: 'var(--text-primary)',
                  marginBottom: '24px',
                  margin: '0 0 24px 0',
                }}
              >
                Your Stadium.
                <br />
                Your{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-blue-bright), var(--accent-teal-bright))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Perfect
                </span>{' '}
                Route.
              </motion.h1>

              {/* Subhead */}
              <motion.p
                variants={fadeUp}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  fontWeight: 400,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: '32px',
                  maxWidth: '480px',
                  margin: '0 0 32px 0',
                }}
              >
                AI-powered gate guidance, real-time crowd routing, and zero-wait navigation for 50,000 attendees at once.
              </motion.p>

              {/* Stat pills */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-10" style={{ marginBottom: '40px' }}>
                {['6× Faster Entry', '40% Less Queue', 'Real-Time AI Routing'].map(stat => (
                  <div
                    key={stat}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 16px',
                      borderRadius: '100px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      fontFamily: 'var(--font-display)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--status-safe)', flexShrink: 0 }} aria-hidden="true" />
                    {stat}
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/select-role')}>
                  Start as Attendee
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/select-role')}>
                  Organizer View
                </Button>
              </motion.div>
            </motion.div>

            {/* Right col — Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="hidden md:block"
              style={{
                transform: 'perspective(1200px) rotateY(-8deg) rotateX(3deg)',
                boxShadow: '40px 40px 100px rgba(0,0,0,0.6), 0 0 60px rgba(59,130,246,0.08)',
                borderRadius: '20px',
              }}
            >
              {/* Gate card preview */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-emphasis)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                }}
              >
                {/* Mini top bar */}
                <div style={{ background: 'var(--bg-surface)', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {['#EF4444', '#F59E0B', '#10B981'].map(c => (
                      <div key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, opacity: 0.8 }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, height: '20px', background: 'var(--bg-elevated)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>stadiumflow.ai/dashboard</span>
                  </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Gate card */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(20,184,166,0.05))', border: '1px solid var(--border-emphasis)', borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}><AIBadge /></div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>BEST GATE</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 700, color: 'var(--accent-blue-bright)', lineHeight: 1, letterSpacing: '-0.03em' }}>C</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)' }}>East Entrance · 38% congestion · ~4 min entry</div>
                    <div style={{ marginTop: '10px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '38%', background: 'var(--status-safe)', borderRadius: '2px' }} />
                    </div>
                  </div>

                  {/* Route card */}
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '14px' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '10px' }}>RECOMMENDED ROUTE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {['Gate C', 'East Walk', 'Ramp 2', 'Section A'].map((step, i) => (
                        <React.Fragment key={step}>
                          <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '100px', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {step}
                          </div>
                          {i < 3 && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <div style={{ marginTop: '10px', fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--accent-blue-bright)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      8 <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>min to your seat</span>
                    </div>
                  </div>

                  {/* Chat preview */}
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                    <ChatDemoLoop />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Problem Section ─────────────────────────── */}
      <section
        className="py-24 px-6 md:px-10"
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>The Problem</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: 'var(--tracking-snug)', color: 'var(--text-primary)', margin: 0 }}>
              Venues are chaotic because attendees guess.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Crowded Gates, Empty Alternatives', desc: 'Fans queue at main gates while side gates sit empty. No one has real-time visibility into crowd distribution.' },
              { num: '02', title: 'Queue Time Destroys Experience', desc: 'Fans miss 20 minutes of the match waiting for food, unaware a stall two sections away is completely empty.' },
              { num: '03', title: 'Chaotic Exits After Every Match', desc: 'Post-match crowds surge unpredictably. Without guidance, attendees waste 30+ minutes navigating the same bottleneck.' },
            ].map(card => (
              <div
                key={card.num}
                style={{
                  padding: '32px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--card-radius)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '64px',
                    fontWeight: 700,
                    color: 'var(--border-subtle)',
                    position: 'absolute',
                    top: '8px',
                    right: '16px',
                    lineHeight: 1,
                    letterSpacing: 'var(--tracking-tight)',
                    userSelect: 'none',
                  }}
                  aria-hidden="true"
                >
                  {card.num}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: 'var(--tracking-normal)', marginTop: 0 }}>
                  {card.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────── */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>How It Works</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: 'var(--tracking-snug)', color: 'var(--text-primary)', margin: 0 }}>
              Three steps to a perfect matchday
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div
              className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px"
              style={{ background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-teal))', opacity: 0.3 }}
              aria-hidden="true"
            />
            {[
              { num: 1, title: 'Tell us your seat', desc: 'Complete a 60-second setup. We personalize every recommendation to your section, preferences, and accessibility needs.' },
              { num: 2, title: 'AI analyzes the venue', desc: 'Gemini processes live crowd data from all gates, corridors, and facilities to build your optimal path in real time.' },
              { num: 3, title: 'Follow your perfect route', desc: 'Get turn-by-turn guidance that updates every 30 seconds as conditions change — zero guessing, zero queue time.' },
            ].map(step => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div
                  style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    background: 'var(--accent-blue-dim)',
                    border: '2px solid var(--accent-blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent-blue-bright)',
                    marginBottom: '20px',
                    position: 'relative', zIndex: 1,
                  }}
                >
                  {step.num}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', marginTop: 0 }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, maxWidth: '260px' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Bento Grid ──────────────────────── */}
      <section className="py-24 px-6 md:px-10" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Platform</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: 'var(--tracking-snug)', color: 'var(--text-primary)', margin: 0 }}>
              Built for scale and intelligence
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featureCards.map(card => (
              <FeatureTiltCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dual Role Showcase ───────────────────────── */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: 'var(--tracking-snug)', color: 'var(--text-primary)', margin: 0 }}>
              One platform. Two superpowers.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Attendee */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--card-radius)', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-blue-dim)', border: '1px solid var(--border-emphasis)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '22px', color: 'var(--accent-blue-bright)' }} aria-hidden="true">local_activity</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>Attendee Experience</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-tertiary)' }}>Personalized matchday intelligence</div>
                </div>
              </div>
              {[
                { icon: 'door_front', text: 'Smart gate routing with live congestion data' },
                { icon: 'map', text: 'Step-by-step navigation to your exact seat' },
                { icon: 'restaurant', text: 'Nearest food stall with shortest queue' },
                { icon: 'wc', text: 'Nearby facilities with real-time wait times' },
                { icon: 'logout', text: 'Exit guidance that activates after full time' },
              ].map(f => (
                <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--accent-blue)' }} aria-hidden="true">{f.icon}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)' }}>{f.text}</span>
                </div>
              ))}
              <button
                onClick={() => navigate('/select-role')}
                className="focus-ring"
                style={{
                  marginTop: '8px',
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                  color: 'var(--accent-blue-bright)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: 0,
                }}
              >
                See it live
                <span className="material-symbols-rounded" style={{ fontSize: '16px' }} aria-hidden="true">arrow_forward</span>
              </button>
            </div>

            {/* Organizer */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--status-caution-border)', borderRadius: 'var(--card-radius)', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--status-caution-bg)', border: '1px solid var(--status-caution-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '22px', color: 'var(--status-caution)' }} aria-hidden="true">dashboard_customize</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>Organizer Control Center</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-tertiary)' }}>Operational AI intelligence</div>
                </div>
              </div>
              {[
                { icon: 'area_chart', text: 'Live zone congestion heatmap across all gates' },
                { icon: 'campaign', text: 'One-tap advisory broadcasts to affected areas' },
                { icon: 'smart_toy', text: 'AI recommendations every 30 seconds' },
                { icon: 'bolt', text: 'Scenario simulation to stress-test plans' },
                { icon: 'people', text: 'Staff deployment intelligence by zone' },
              ].map(f => (
                <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--status-caution)' }} aria-hidden="true">{f.icon}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)' }}>{f.text}</span>
                </div>
              ))}
              <button
                onClick={() => navigate('/select-role')}
                className="focus-ring"
                style={{
                  marginTop: '8px',
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                  color: 'var(--status-caution)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: 0,
                }}
              >
                See it live
                <span className="material-symbols-rounded" style={{ fontSize: '16px' }} aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI Showcase ──────────────────────────────── */}
      <section className="py-24 px-6 md:px-10" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
          {/* Animated chat */}
          <div className="flex-1 w-full max-w-sm">
            <ChatDemoLoop />
          </div>

          {/* Copy */}
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '14px', color: 'var(--accent-blue)' }} aria-hidden="true">bolt</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Powered by Google Gemini 1.5 Flash
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, letterSpacing: 'var(--tracking-snug)', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: 1.2, marginTop: 0 }}>
              Generative AI that understands physical space.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '28px', margin: '0 0 28px 0' }}>
              It's not just a chatbot. StadiumFlow injects live localized venue data into every prompt, enabling the AI to act as a highly aware real-time orchestrator for your specific location and event phase.
            </p>
            {/* Four response pillars */}
            {[
              { label: 'Recommendation', color: 'var(--accent-blue)', text: 'One clear, confident action to take right now' },
              { label: 'Why', color: 'transparent', text: 'The live data behind the recommendation' },
              { label: 'Time Impact', color: 'var(--accent-teal)', text: 'Exactly how much time you save or lose' },
              { label: 'Backup Option', color: 'transparent', text: 'A secondary path if your situation changes' },
            ].map(row => (
              <div
                key={row.label}
                style={{
                  padding: '10px 14px',
                  borderLeft: row.color !== 'transparent' ? `3px solid ${row.color}` : undefined,
                  borderBottom: '1px solid var(--border-ghost)',
                  marginBottom: '1px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', marginBottom: '3px' }}>{row.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>{row.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="py-12 px-6 md:px-10" style={{ background: 'var(--bg-void)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M11 2L19.66 7V17L11 22L2.34 17V7L11 2Z" stroke="var(--accent-blue)" strokeWidth="1.5" fill="var(--accent-blue-dim)" />
                <path d="M8 11h2m0 0l2-2m-2 2l2 2" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              StadiumFlow<span style={{ color: 'var(--accent-blue)' }}>AI</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              AI-powered matchday intelligence for venues of any scale.
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>Powered by Google Gemini</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', marginBottom: '16px' }}>Product</div>
            {['Attendee App', 'Organizer Center', 'API Access', 'Integrations'].map(link => (
              <button
                key={link}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)', fontSize: '14px',
                  color: 'var(--text-tertiary)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                  textAlign: 'left', transition: 'color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                className="focus-ring"
              >
                {link}
              </button>
            ))}
          </div>

          {/* Gemini attribution */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', marginBottom: '16px' }}>Powered By</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-rounded" style={{ fontSize: '16px', color: '#fff' }} aria-hidden="true">auto_awesome</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Google Gemini 1.5 Flash</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>Live venue context injected per response</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid var(--border-ghost)' }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            © 2026 StadiumFlow AI. Created for demonstration purposes.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Accessibility'].map(link => (
              <button
                key={link}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '12px',
                  color: 'var(--text-muted)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                className="focus-ring"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
