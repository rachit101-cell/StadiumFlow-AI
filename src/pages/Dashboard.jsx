import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useVenue } from '../contexts/VenueContext';
import { getRecommendations } from '../utils/recommendationEngine';
import { Card, Button, StatusBadge, CongestionMeter, AIBadge } from '../components/ui';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { use3DTilt } from '../hooks/use3DTilt';

/* ── Skeleton shapes ── */
const SkeletonGate = () => (
  <div
    className="rounded-[20px] overflow-hidden"
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      padding: 'var(--space-5)',
      height: '240px',
    }}
    aria-hidden="true"
  >
    <div className="skeleton-premium" style={{ height: '20px', width: '35%', borderRadius: '6px', marginBottom: '20px' }} />
    <div className="skeleton-premium" style={{ height: '80px', width: '50%', borderRadius: '10px', marginBottom: '16px' }} />
    <div className="skeleton-premium" style={{ height: '5px', borderRadius: '3px', marginBottom: '12px' }} />
    <div className="skeleton-premium" style={{ height: '14px', width: '70%', borderRadius: '4px', marginBottom: '8px' }} />
    <div className="skeleton-premium" style={{ height: '14px', width: '40%', borderRadius: '4px' }} />
  </div>
);
const SkeletonCard = ({ height }) => (
  <div
    className="rounded-[16px]"
    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 'var(--space-5)', height }}
    aria-hidden="true"
  >
    <div className="skeleton-premium" style={{ height: '14px', width: '45%', borderRadius: '4px', marginBottom: '16px' }} />
    <div className="skeleton-premium" style={{ height: '100%', borderRadius: '8px' }} />
  </div>
);

/* ── Phase Timeline ── */
const PHASES = ['pre-match', 'live-match', 'halftime', 'post-match'];
const PHASE_LABELS = { 'pre-match': 'Pre-Match', 'live-match': 'Live', 'halftime': 'Half Time', 'post-match': 'Post-Match' };

const PhaseTimeline = ({ currentPhase }) => {
  const currentIndex = PHASES.indexOf(currentPhase);
  return (
    <div
      className="col-span-full flex items-center justify-between px-6 py-4 rounded-2xl relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
      role="progressbar"
      aria-label={`Event phase: ${PHASE_LABELS[currentPhase] || currentPhase}`}
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={4}
    >
      {/* Base line */}
      <div
        className="absolute top-1/2 left-10 right-10 h-px"
        style={{ background: 'var(--border-subtle)', transform: 'translateY(-50%)' }}
        aria-hidden="true"
      />
      {/* Progress fill */}
      <motion.div
        className="absolute top-1/2 left-10 h-px phase-line-fill"
        style={{
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-teal))',
          transform: 'translateY(-50%)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(currentIndex / (PHASES.length - 1), 1) * 100 * ((100 - 20 * 2) / 100)}%` }}
        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        aria-hidden="true"
      />
      {PHASES.map((phase, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        return (
          <div
            key={phase}
            className="flex flex-col items-center gap-2 relative z-10 px-2"
            style={{ background: 'var(--bg-card)' }}
          >
            <motion.div
              style={{
                width: '14px', height: '14px',
                borderRadius: '50%',
                borderWidth: '2px', borderStyle: 'solid',
                borderColor: isActive ? 'var(--accent-blue)' : isPast ? 'var(--status-safe)' : 'var(--border-default)',
                background: isActive ? 'var(--accent-blue)' : isPast ? 'var(--status-safe)' : 'var(--bg-base)',
                boxShadow: isActive ? '0 0 0 4px var(--accent-blue-dim)' : 'none',
                transition: 'all 500ms ease',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-widest)',
                color: isActive ? 'var(--accent-blue-bright)' : isPast ? 'var(--text-secondary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {PHASE_LABELS[phase]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Route Pill Chain ── */
const RoutePills = ({ gateId, seatSection }) => {
  const steps = [`Gate ${gateId}`, 'East Walk', 'Ramp 2', `Section ${seatSection}`];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: '100px',
              background: i === 0 || i === steps.length - 1 ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
              border: `1px solid ${i === 0 || i === steps.length - 1 ? 'var(--border-emphasis)' : 'var(--border-default)'}`,
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 600,
              color: i === 0 || i === steps.length - 1 ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
            }}
          >
            {step}
          </div>
          {i < steps.length - 1 && (
            <span
              className="material-symbols-rounded"
              style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0 }}
              aria-hidden="true"
            >
              chevron_right
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ── Main Dashboard ── */
export const Dashboard = () => {
  const { userProfile } = useUser();
  const { venueState } = useVenue();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const bestGateTilt = use3DTilt('accent');
  const routeTilt = use3DTilt('standard');
  const emergencyTilt = use3DTilt('standard');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const recs = getRecommendations(venueState, userProfile);
  const isPostMatch = venueState.eventPhase === 'post-match';

  const containerVariants = { animate: { transition: { staggerChildren: 0.08 } } };
  const cardVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      {/* Phase Timeline — spans all cols */}
      <PhaseTimeline currentPhase={venueState.eventPhase} />

      {/* ── Main Column (2/3 width) ── */}
      <div className="col-span-1 md:col-span-2 space-y-5">

        {/* Best Gate / Post-Match Exit Card */}
        {loading ? (
          <SkeletonGate />
        ) : isPostMatch ? (
          <motion.div variants={cardVariants}>
            <div
              className="rounded-[20px] p-5 relative overflow-hidden group cursor-pointer card-shimmer-top"
              style={{
                background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(16,185,129,0.04))',
                border: '1px solid rgba(20,184,166,0.2)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.2)',
              }}
              onClick={() => navigate('/exit')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate('/exit')}
              aria-label="View exit guidance"
            >
              <div className="card-shimmer-top card-accent" />
              <div
                className="absolute top-0 right-0 p-4 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                aria-hidden="true"
              >
                <span className="material-symbols-rounded" style={{ fontSize: '96px', color: 'var(--accent-teal)' }}>logout</span>
              </div>
              <StatusBadge status="safe" label="Exit Guidance Active" icon="check_circle" className="mb-4" />
              <div className="flex justify-between items-end mb-5 relative z-10">
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px', fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-widest)',
                      color: 'var(--text-muted)', display: 'block', marginBottom: '4px',
                    }}
                  >
                    BEST EXIT
                  </span>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '48px', fontWeight: 700,
                      letterSpacing: 'var(--tracking-tight)', lineHeight: 1,
                      color: 'var(--accent-teal-bright)',
                      margin: 0,
                    }}
                  >
                    {recs.bestExit.label}
                  </h2>
                </div>
                <div className="text-right">
                  <div
                    style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent-teal-bright)', lineHeight: 1 }}
                  >
                    <AnimatedNumber value={recs.bestExit.etaMinutes} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>min</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>Est. walk time</div>
                </div>
              </div>
              <div
                className="p-3 rounded-xl mb-4"
                style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)' }}
              >
                <div
                  className="flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--accent-teal-bright)' }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '15px' }} aria-hidden="true">lightbulb</span>
                  {recs.bestExit.reason}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>Alternate:</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{recs.bestExit.alternate}</span>
                </div>
                <Button variant="ghost" style={{ color: 'var(--accent-teal-bright)', padding: 0 }}>
                  View Plan
                  <span className="material-symbols-rounded" style={{ fontSize: '16px', marginLeft: '4px' }} aria-hidden="true">arrow_forward</span>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── BEST GATE CARD ── */
          <motion.div variants={cardVariants}>
            <div
              ref={bestGateTilt.ref}
              className="tilt-wrapper rounded-[20px] p-5 relative overflow-hidden group cursor-pointer card-shimmer-top card-accent"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(20,184,166,0.04))',
                border: '1px solid var(--border-emphasis)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.2)',
              }}
              onClick={() => navigate('/navigate')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate('/navigate')}
              aria-label={`Best gate recommended: Gate ${recs.bestGate.id}`}
            >
              <div className="tilt-shine" />
              <div
                className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.09] transition-opacity"
                aria-hidden="true"
              >
                <span className="material-symbols-rounded" style={{ fontSize: '96px', color: 'var(--accent-blue)' }}>door_front</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <StatusBadge status="safe" label="Live Entry Guidance" />
                <AIBadge />
              </div>
              <div className="flex justify-between items-end mb-5 relative z-10">
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px', fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-widest)',
                      color: 'var(--text-muted)', display: 'block', marginBottom: '4px',
                    }}
                  >
                    BEST GATE
                  </span>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '72px', fontWeight: 700,
                      letterSpacing: 'var(--tracking-tight)', lineHeight: 1,
                      color: 'var(--accent-blue-bright)',
                      margin: 0,
                    }}
                  >
                    {recs.bestGate.id}
                  </h2>
                  <div style={{ marginTop: '10px', width: '180px' }}>
                    <CongestionMeter value={recs.bestGate.congestion} label="Congestion" />
                  </div>
                </div>
                <div className="text-right">
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '36px', fontWeight: 700,
                      color: 'var(--accent-blue-bright)', lineHeight: 1,
                    }}
                  >
                    <AnimatedNumber value={recs.bestGate.eta} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>min</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>Est. wait time</div>
                </div>
              </div>
              <div
                className="p-3 rounded-xl mb-4"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--accent-blue-bright)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '15px' }} aria-hidden="true">info</span>
                  {recs.bestGate.reason}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>Alternate:</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Gate {recs.bestGate.alternate}</span>
                </div>
                <Button variant="ghost" style={{ color: 'var(--accent-blue-bright)', padding: 0 }}>
                  View Map
                  <span className="material-symbols-rounded" style={{ fontSize: '16px', marginLeft: '4px' }} aria-hidden="true">arrow_forward</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Route Card */}
        {loading ? (
          <SkeletonCard height="160px" />
        ) : (
          <motion.div variants={cardVariants}>
            <div ref={routeTilt.ref} className="tilt-wrapper">
              <Card role="region" aria-label="Your route summary">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--text-muted)' }} aria-hidden="true">route</span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px', fontWeight: 600,
                      letterSpacing: 'var(--tracking-normal)',
                      margin: 0,
                    }}
                  >
                    Your Route to Section {userProfile.seatSection}
                  </h3>
                </div>
                <div
                  className="p-4 rounded-xl mb-3"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  <RoutePills gateId={recs.bestGate.id} seatSection={userProfile.seatSection} />
                  <div
                    className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: '1px solid var(--border-ghost)' }}
                  >
                    <div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Total Time</span>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--accent-blue-bright)', lineHeight: 1 }}>
                        <AnimatedNumber value={recs.bestGate.eta + 4} /><span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>min to seat</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/navigate')}
                      leftIcon="map"
                    >
                      Start Navigation
                    </Button>
                  </div>
                </div>
                {venueState.corridors?.innerNorth?.congestion > 65 && (
                  <div
                    className="flex items-center gap-2"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--status-caution-bg)',
                      border: '1px solid var(--status-caution-border)',
                      fontFamily: 'var(--font-body)', fontSize: '12px',
                      color: 'var(--status-caution)',
                      fontWeight: 500,
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '14px' }} aria-hidden="true">warning</span>
                    Route Updated — avoiding congested North Inner Corridor
                  </div>
                )}
                {/* Personalization line */}
                <div
                  className="flex items-center gap-1.5 mt-3"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '12px', color: 'var(--accent-teal)' }} aria-hidden="true">person</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Personalized for{userProfile.accessibilityMode ? ' stair-free routing' : ` Section ${userProfile.seatSection}`}
                    {userProfile.familyGroupMode ? ` · Group of ${userProfile.groupSize}` : ''}
                  </span>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Right Column (1/3 width) ── */}
      <div className="space-y-5">

        {/* Smart Suggestion */}
        {loading ? (
          <SkeletonCard height="90px" />
        ) : (
          <motion.div variants={cardVariants}>
            <div
              className="rounded-2xl p-4"
              style={recs.shouldLeaveNow
                ? { background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', borderLeft: '3px solid var(--status-danger)' }
                : { background: 'var(--status-safe-bg)', border: '1px solid var(--status-safe-border)', borderLeft: '3px solid var(--status-safe)' }
              }
              role="region"
              aria-label="Smart suggestion"
            >
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-widest)',
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                Smart Suggestion
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '17px', fontWeight: 600,
                  lineHeight: 1.3,
                  letterSpacing: 'var(--tracking-normal)',
                  color: recs.shouldLeaveNow ? 'var(--status-danger)' : 'var(--status-safe)',
                  margin: 0,
                }}
              >
                {recs.leaveAdvice}
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick Facilities */}
        {loading ? (
          <SkeletonCard height="200px" />
        ) : (
          <motion.div variants={cardVariants}>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-widest)',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}
            >
              Nearest Facilities
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'restaurant', color: 'var(--status-caution)', label: recs.bestFood.name, wait: recs.bestFood.waitTime, reason: recs.bestFood.reason },
                { icon: 'wc', color: 'var(--accent-teal)', label: recs.bestWashroom.label, wait: recs.bestWashroom.waitTime, reason: recs.bestWashroom.reason },
              ].map(f => {
                const isLow = f.wait <= 3;
                return (
                  <button
                    key={f.label}
                    className="p-4 rounded-2xl cursor-pointer flex flex-col justify-between text-left focus-ring"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      transition: 'all 200ms ease',
                    }}
                    onClick={() => navigate('/facilities')}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
                    aria-label={`${f.label}, ${f.wait} minute wait`}
                  >
                    <div>
                      <span className="material-symbols-rounded" style={{ fontSize: '20px', color: f.color, display: 'block', marginBottom: '8px' }} aria-hidden="true">{f.icon}</span>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</h4>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: isLow ? 'var(--status-safe)' : 'var(--text-primary)', lineHeight: 1 }}>
                        <AnimatedNumber value={f.wait} /><span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginLeft: '3px' }}>min</span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)', fontSize: '10px',
                        color: 'var(--text-muted)', marginTop: '10px', paddingTop: '10px',
                        borderTop: '1px solid var(--border-ghost)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {f.reason}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Emergency Card */}
        <motion.div variants={cardVariants}>
          <div
            ref={emergencyTilt.ref}
            className="tilt-wrapper rounded-2xl p-5"
            style={{
              background: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              position: 'relative',
              overflow: 'hidden',
            }}
            role="region"
            aria-label="Emergency assistance"
          >
            <div className="tilt-shine" />
            <div
              className="flex items-center gap-2 mb-4"
              style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--status-danger)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">health_and_safety</span>
              Assistance
            </div>

            <Button
              variant="danger"
              className="w-full mb-3 btn-emergency"
              onClick={() => window.alert('Emergency sequence active')}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '16px' }} aria-hidden="true">sos</span>
              SOS Emergency
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {['Medical Help', 'Report Issue'].map(label => (
                <button
                  key={label}
                  className="focus-ring"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px', fontWeight: 500,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-emphasis)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
