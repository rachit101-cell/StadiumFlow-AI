import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useVenue } from '../contexts/VenueContext';
import { getRecommendations } from '../utils/recommendationEngine';
import { Card, StatusBadge, FilterChip, AIBadge } from '../components/ui';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Sparkline ── */
const Sparkline = ({ data = [] }) => {
  if (data.length < 2) return <div style={{ width: '60px', height: '24px' }} />;
  const w = 64, h = 24, sw = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const getX = (i) => (i / (data.length - 1)) * (w - sw * 2) + sw;
  const getY = (v) => h - ((v - min) / range) * (h - sw * 2) - sw;
  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' L ');
  const d = `M ${points}`;
  const isRising = data[data.length - 1] > data[0];
  const color = isRising ? 'var(--status-danger)' : 'var(--status-safe)';
  const lastX = getX(data.length - 1);
  const lastY = getY(data[data.length - 1]);
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
};

/* ── Wait Time Card ── */
const WaitTimeCard = ({ fac, isBest, isAlternate, trendData, type, recs }) => {
  const [hovered, setHovered] = useState(false);
  const accentColor = 'var(--accent-blue)';
  const besColor = 'var(--status-safe)';

  let comparisonText = '';
  if (isBest) {
    comparisonText = `${fac.name || fac.label} is your optimal choice with a ${fac.waitTime} min wait.`;
  } else {
    const bestFac = type === 'food' ? recs.bestFood : recs.bestWashroom;
    const diff = fac.waitTime - bestFac.waitTime;
    comparisonText = diff > 0
      ? `${Math.abs(diff)} min longer wait than optimal option.`
      : `${Math.abs(diff)} min shorter walk but busier route.`;
  }

  const waitColor = fac.waitTime > 10
    ? 'var(--status-danger)' : fac.waitTime > 6
    ? 'var(--status-caution)' : fac.waitTime > 3
    ? 'var(--status-warning)' : 'var(--status-safe)';

  return (
    <div
      className="rounded-[16px] p-5 relative overflow-hidden"
      style={{
        background: isBest
          ? 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(20,184,166,0.04))'
          : 'var(--bg-card)',
        border: `1px solid ${isBest ? 'var(--border-emphasis)' : isAlternate ? 'rgba(20,184,166,0.2)' : 'var(--border-subtle)'}`,
        marginBottom: '12px',
        boxShadow: isBest ? '0 0 20px rgba(59,130,246,0.06), 0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.4)',
        transition: 'all 200ms ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isBest && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--accent-blue) 50%, transparent)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {isBest && (
            <div
              className="inline-flex items-center gap-1 mb-2"
              style={{
                background: 'var(--accent-blue-dim)',
                border: '1px solid var(--border-emphasis)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontFamily: 'var(--font-body)',
                fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                color: 'var(--accent-blue-bright)',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '11px' }} aria-hidden="true">star</span>
              Best Option
            </div>
          )}
          {isAlternate && !isBest && (
            <div
              className="inline-flex items-center gap-1 mb-2"
              style={{
                background: 'var(--accent-teal-dim)',
                border: '1px solid rgba(20,184,166,0.2)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontFamily: 'var(--font-body)',
                fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                color: 'var(--accent-teal-bright)',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '11px' }} aria-hidden="true">flash_on</span>
              Faster Alternative
            </div>
          )}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px', fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-normal)',
              margin: 0,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {fac.name || fac.label}
            {fac.accessible && (
              <span className="material-symbols-rounded" style={{ fontSize: '14px', color: 'var(--status-safe)' }} title="Accessible" aria-label="Wheelchair accessible">accessible</span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge
              status={fac.crowdLevel > 75 ? 'danger' : fac.crowdLevel > 50 ? 'warning' : 'safe'}
              label={`Crowd: ${fac.crowdLevel}%`}
            />
            {fac.type?.map(t => (
              <span
                key={t}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px', padding: '2px 7px',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Wait time + sparkline */}
        <div className="text-right">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: waitColor, lineHeight: 1, letterSpacing: 'var(--tracking-tight)' }}>
            <AnimatedNumber value={fac.waitTime} /><span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '3px' }}>min</span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>Wait Time</div>
          <Sparkline data={trendData} />
        </div>
      </div>

      {/* Smart comparison */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-ghost)',
          borderRadius: '10px',
          padding: '10px 12px',
          fontFamily: 'var(--font-body)', fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '4px' }}>Smart Comparison:</span>
        {comparisonText}
      </div>
    </div>
  );
};

export const FacilitiesView = () => {
  const [activeTab, setActiveTab] = useState('food');
  const { userProfile } = useUser();
  const { venueState } = useVenue();
  const [history, setHistory] = useState({});

  useEffect(() => {
    setHistory(prev => {
      const next = { ...prev };
      Object.entries(venueState.foodStalls).forEach(([id, f]) => {
        if (!next[id]) next[id] = Array(5).fill(f.waitTime);
        next[id] = [...next[id].slice(1), f.waitTime];
      });
      Object.entries(venueState.washrooms).forEach(([id, w]) => {
        if (!next[id]) next[id] = Array(5).fill(w.waitTime);
        next[id] = [...next[id].slice(1), w.waitTime];
      });
      return next;
    });
  }, [venueState]);

  const recs = getRecommendations(venueState, userProfile);
  const foodList = Object.entries(venueState.foodStalls).map(([id, f]) => ({ id, ...f })).sort((a, b) => a.waitTime - b.waitTime);
  const washroomList = Object.entries(venueState.washrooms).map(([id, w]) => ({ id, ...w })).sort((a, b) => a.waitTime - b.waitTime);

  return (
    <div className="max-w-4xl mx-auto">
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px', fontWeight: 700,
          letterSpacing: 'var(--tracking-tight)',
          marginBottom: '24px', marginTop: 0,
        }}
      >
        Facilities Assistant
      </h1>

      {/* Summary header card */}
      <div
        className="mb-6 p-5 rounded-[16px] flex flex-col md:flex-row gap-4 justify-between md:items-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        role="region"
        aria-label="Your live profile summary"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <AIBadge />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)' }}>Live Context</span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Section <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userProfile.seatSection}</span>
            {' · '}{userProfile.accessibilityMode ? 'Stair-free mode' : 'Standard routing'}
            {' · '}{venueState.eventPhase?.replace('-', ' ')}
          </p>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
            color: 'var(--accent-blue-bright)',
            borderLeft: '1px solid var(--border-subtle)',
            paddingLeft: '24px',
            lineHeight: 1.5,
          }}
          className="hidden md:block"
        >
          {recs.shouldLeaveNow ? recs.leaveAdvice : 'Queue levels are stable right now.'}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 border-b overflow-x-auto scrollbar-hide pb-px mb-6"
        style={{ borderColor: 'var(--border-subtle)' }}
        role="tablist"
        aria-label="Facility type"
      >
        {[
          { id: 'food', label: 'Food Stalls', icon: 'restaurant' },
          { id: 'washroom', label: 'Washrooms', icon: 'wc' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            className="flex items-center gap-2 px-4 py-2.5 relative focus-ring whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px', fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }} aria-hidden="true">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: 'var(--accent-blue-bright)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'food' && foodList.map(f => (
            <WaitTimeCard
              key={f.id}
              fac={f}
              isBest={f.id === recs.bestFood.id}
              isAlternate={f.id === recs.bestFood.alternate}
              trendData={history[f.id] || []}
              type="food"
              recs={recs}
            />
          ))}
          {activeTab === 'washroom' && washroomList.map(w => (
            <WaitTimeCard
              key={w.id}
              fac={w}
              isBest={w.id === recs.bestWashroom.id}
              isAlternate={w.id === recs.bestWashroom.alternate}
              trendData={history[w.id] || []}
              type="washroom"
              recs={recs}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
