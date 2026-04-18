import React from 'react';
import { useVenue } from '../contexts/VenueContext';
import { useUser } from '../contexts/UserContext';
import { getRecommendations } from '../utils/recommendationEngine';
import { Card, Button, StatusBadge } from '../components/ui';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { motion } from 'framer-motion';

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
};

const ExitCongestionBar = ({ value }) => {
  const color = value > 75 ? 'var(--status-danger)' : value > 60 ? 'var(--status-warning)' : value > 40 ? 'var(--status-caution)' : 'var(--status-safe)';
  return (
    <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
      <motion.div
        style={{ height: '100%', borderRadius: '3px', background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      />
    </div>
  );
};

export const ExitGuidance = () => {
  const { venueState } = useVenue();
  const { userProfile } = useUser();
  const isPostMatch = venueState.eventPhase === 'post-match';
  const recs = getRecommendations(venueState, userProfile);

  /* Pre-match locked state */
  if (!isPostMatch) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center min-h-[50vh] gap-5"
      >
        <div
          style={{
            width: '72px', height: '72px',
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '36px', color: 'var(--text-muted)' }} aria-hidden="true">sports</span>
        </div>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700,
              letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)',
              marginBottom: '10px', marginTop: 0,
            }}
          >
            Match is still live
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '400px', lineHeight: 1.65 }}>
            Exit guidance and transportation details will activate automatically when the post-match phase begins.
          </p>
        </div>

        {/* Phase indicator */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '100px',
            background: 'var(--status-safe-bg)',
            border: '1px solid var(--status-safe-border)',
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
            color: 'var(--status-safe)',
          }}
        >
          <span className="animate-pulse-live" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--status-safe)', flexShrink: 0 }} aria-hidden="true" />
          {venueState.eventPhase?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · Exit plan activates at final whistle
        </div>
      </div>
    );
  }

  const exitData = Object.entries(venueState.exits).map(([id, e]) => ({ id, ...e })).sort((a, b) => a.crowdLevel - b.crowdLevel);
  const primaryIsCongested = recs.bestExit.crowdLevel > 75;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1
        style={{
          fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700,
          letterSpacing: 'var(--tracking-tight)', marginBottom: '24px', marginTop: 0,
        }}
      >
        Exit Plan
      </h1>

      {/* Post-match announcement banner */}
      <div
        className="flex items-center justify-center gap-3 p-4 rounded-2xl mb-8"
        style={{
          background: 'var(--accent-blue-dim)',
          border: '1px solid var(--border-emphasis)',
        }}
        role="status"
        aria-live="polite"
      >
        <span className="animate-pulse-live" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--accent-blue-bright)', letterSpacing: 'var(--tracking-normal)' }}>
          Match has ended — here is your personalized exit plan.
        </span>
      </div>

      {/* Primary grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">

        {/* Best Exit Accent Card */}
        <motion.div variants={cardVariants} initial="initial" animate="animate">
          <div
            className="rounded-[20px] p-6 relative overflow-hidden card-shimmer-top card-accent"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(20,184,166,0.04))',
              border: '1px solid var(--border-emphasis)',
              height: '100%',
            }}
            role="region"
            aria-label="Recommended exit route"
          >
            {/* Ghost icon */}
            <div
              className="absolute top-0 right-0 p-4 pointer-events-none"
              style={{ opacity: 0.05 }}
              aria-hidden="true"
            >
              <span className="material-symbols-rounded" style={{ fontSize: '96px' }}>exit_to_app</span>
            </div>

            <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', marginBottom: '16px' }}>
              RECOMMENDED EXIT
            </div>

            <div className="flex items-end justify-between mb-6 relative z-10">
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 700,
                    letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)',
                    lineHeight: 1, margin: '0 0 8px 0',
                  }}
                >
                  {recs.bestExit.label}
                </h2>
                <StatusBadge status={recs.bestExit.crowdLevel > 70 ? 'warning' : 'safe'} label={`${recs.bestExit.crowdLevel}% Crowd`} />
              </div>
              <div className="text-right">
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: 'var(--accent-blue-bright)', lineHeight: 1 }}>
                  <AnimatedNumber value={recs.bestExit.etaMinutes} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>min</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)' }}>Walk Time</div>
              </div>
            </div>

            {/* Reason card */}
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px 14px',
                fontFamily: 'var(--font-body)', fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '4px' }}>Why:</span>
              {recs.bestExit.reason}
            </div>
          </div>
        </motion.div>

        {/* Leave vs Wait Card */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" style={{ transitionDelay: '0.1s' }}>
          <div
            className="rounded-[20px] p-6 flex flex-col items-center justify-center text-center h-full"
            style={primaryIsCongested
              ? { background: 'var(--status-caution-bg)', border: '1px solid var(--status-caution-border)' }
              : { background: 'var(--status-safe-bg)', border: '1px solid var(--status-safe-border)' }
            }
            role="region"
            aria-label={primaryIsCongested ? 'Wait recommendation' : 'Leave now recommendation'}
          >
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: '48px',
                color: primaryIsCongested ? 'var(--status-caution)' : 'var(--status-safe)',
                marginBottom: '16px',
              }}
              aria-hidden="true"
            >
              {primaryIsCongested ? 'hourglass_top' : 'directions_walk'}
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px', fontWeight: 700,
                letterSpacing: 'var(--tracking-tight)',
                color: primaryIsCongested ? 'var(--status-caution)' : 'var(--status-safe)',
                marginBottom: '12px', marginTop: 0,
              }}
            >
              {primaryIsCongested ? 'Wait 6 Minutes' : 'Leave Now'}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)', fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                maxWidth: '280px',
                margin: 0,
              }}
            >
              {primaryIsCongested
                ? `Crowd at ${recs.bestExit.label} peaks in the next 4 minutes then drops rapidly. Waiting saves approximately 8 minutes.`
                : `The route to ${recs.bestExit.label} is currently low congestion. Proceed to the exit for a smooth departure.`
              }
            </p>
          </div>
        </motion.div>
      </div>

      {/* All Exits Overview */}
      <h3
        style={{
          fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700,
          letterSpacing: 'var(--tracking-tight)', marginBottom: '16px', marginTop: 0,
        }}
      >
        All Exits Overview
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {exitData.map(e => {
          const color = e.crowdLevel > 75 ? 'var(--status-danger)' : e.crowdLevel > 60 ? 'var(--status-warning)' : e.crowdLevel > 40 ? 'var(--status-caution)' : 'var(--status-safe)';
          return (
            <div
              key={e.id}
              className="p-4 flex flex-col items-center text-center rounded-[16px]"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              <h4
                style={{
                  fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700,
                  color: 'var(--text-primary)', marginBottom: '10px', marginTop: 0,
                }}
              >
                {e.label}
              </h4>
              <ExitCongestionBar value={e.crowdLevel} />
              <div className="flex gap-2 mb-3 flex-wrap justify-center">
                {e.parkingNearby && (
                  <span
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px', padding: '2px 7px',
                      display: 'flex', alignItems: 'center', gap: '3px',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '11px' }} aria-hidden="true">local_parking</span>
                    Parking
                  </span>
                )}
                {e.transportNearby && (
                  <span
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px', padding: '2px 7px',
                      display: 'flex', alignItems: 'center', gap: '3px',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '11px' }} aria-hidden="true">train</span>
                    Transit
                  </span>
                )}
              </div>
              <div
                className="pt-2 w-full text-center"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: color }}>{e.etaMinutes}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginLeft: '3px' }}>min</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transport Info */}
      <Card role="region" aria-label="Transport and parking information">
        <h3
          style={{
            fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600,
            letterSpacing: 'var(--tracking-normal)',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginTop: 0, marginBottom: '16px',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--accent-blue)' }} aria-hidden="true">directions_car</span>
          Transport & Arrival Guidance
        </h3>
        <div className="flex flex-col md:flex-row gap-5">
          {[
            { icon: 'local_parking', title: 'Parking Zones', text: 'If you parked in East Parking, use East Exit. Wait times at parking exits currently 10–15 mins.' },
            { icon: 'train', title: 'Public Transport', text: 'South station is 4 min walk. Next train departs in 12 mins. Route is well-lit and monitored.' },
          ].map(item => (
            <div
              key={item.title}
              className="flex-1 p-4 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '22px', color: 'var(--accent-blue)', display: 'block', marginBottom: '8px' }} aria-hidden="true">{item.icon}</span>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: 0, marginBottom: '6px' }}>{item.title}</h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
