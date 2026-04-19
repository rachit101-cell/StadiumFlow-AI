import React, { useState, useEffect } from 'react';
import { useVenue } from '../contexts/VenueContext';
import { useSimulation } from '../hooks/useSimulation';
import { Card, StatusBadge, Button, AIBadge, CongestionMeter } from '../components/ui';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

import { motion, AnimatePresence } from 'framer-motion';

/* ─── Helpers ─── */
const getCongestionColor = (v) => {
  if (v >= 81) return 'var(--status-danger)';
  if (v >= 66) return 'var(--status-warning)';
  if (v >= 41) return 'var(--status-caution)';
  return 'var(--status-safe)';
};
const getCongestionStatus = (v) => {
  if (v >= 81) return 'danger';
  if (v >= 66) return 'warning';
  if (v >= 41) return 'caution';
  return 'safe';
};

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

/* ─── Trend Chart ─── */
const CongestionTrendChart = ({ historyData }) => {
  const zones = Object.keys(historyData);
  if (zones.length === 0 || historyData[zones[0]].length < 2) {
    return (
      <div className="h-full flex items-center justify-center" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
        Accumulating trend data…
      </div>
    );
  }
  const width = 1000, height = 240, px = 48, py = 20;
  const ew = width - px * 2, eh = height - py * 2;
  const colors = ['var(--accent-blue)', 'var(--accent-teal)', 'var(--status-warning)', 'var(--status-danger)', 'var(--status-caution)'];
  const xStep = ew / (historyData[zones[0]].length - 1);
  const getPath = (d) => 'M ' + d.map((v, i) => `${px + i * xStep},${height - py - (v / 100) * eh}`).join(' L ');

  // Hard colors for SVG (vars don't work inside SVG fill/stroke)
  const hardColors = ['#3B82F6', '#14B8A6', '#F97316', '#EF4444', '#F59E0B'];

  return (
    <div className="w-full h-full relative" role="img" aria-label="Congestion trend chart for top 5 zones">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <line
            key={v}
            x1={px} y1={height - py - (v / 100) * eh}
            x2={width - px} y2={height - py - (v / 100) * eh}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            strokeDasharray={v === 50 ? '6 4' : ''}
          />
        ))}
        {/* Y-axis labels */}
        {[0, 50, 100].map(v => (
          <text
            key={v}
            x={px - 10} y={height - py - (v / 100) * eh + 4}
            fill="#475569"
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize="11"
          >
            {v}
          </text>
        ))}
        {/* 80% danger threshold line */}
        <line
          x1={px} y1={height - py - 0.8 * eh}
          x2={width - px} y2={height - py - 0.8 * eh}
          stroke="rgba(239,68,68,0.25)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text x={width - px + 4} y={height - py - 0.8 * eh + 4} fill="rgba(239,68,68,0.5)" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600">80%</text>

        {/* Zone lines */}
        {zones.map((zone, i) => (
          <path
            key={zone}
            d={getPath(historyData[zone])}
            fill="none"
            stroke={hardColors[i % hardColors.length]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute top-0 right-0 flex flex-wrap gap-4">
        {zones.map((zone, i) => (
          <div key={zone} className="flex items-center gap-1.5">
            <span
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: hardColors[i % hardColors.length], flexShrink: 0 }}
              aria-hidden="true"
            />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-secondary)' }}>{zone}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Gate Zone Card ─── */
const GateZoneCard = ({ id, data }) => {
  const status = getCongestionStatus(data.congestion);
  const color = getCongestionColor(data.congestion);
  const isCritical = data.congestion >= 81;
  const isHigh = data.congestion >= 66 && data.congestion < 81;

  return (
    <motion.div variants={cardVariants} initial="initial" animate="animate">
      <div
        className={`p-4 rounded-[16px] group ${isCritical ? 'zone-breathe-critical' : isHigh ? 'zone-high' : ''}`}
        style={{
          background: isCritical ? 'rgba(239,68,68,0.06)' : 'var(--bg-card)',
          border: `1px solid ${isCritical ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
          borderLeft: `3px solid ${color}`,
          boxShadow: isCritical ? '0 0 16px rgba(239,68,68,0.12)' : '0 1px 4px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
        role="region"
        aria-label={`Gate ${id}: ${data.congestion}% congestion, status ${status}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
              color: 'var(--text-muted)',
            }}
          >
            Gate {id}
          </span>
          <StatusBadge status={status} label={status.charAt(0).toUpperCase() + status.slice(1)} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '34px', color, letterSpacing: 'var(--tracking-tight)', lineHeight: 1,
            marginBottom: '8px',
          }}
        >
          <AnimatedNumber value={data.congestion} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginLeft: '2px' }}>%</span>
        </div>
        <CongestionMeter value={data.congestion} />
        <span className="sr-only">Gate {id} congestion: {data.congestion} percent, status: {status}</span>
      </div>
    </motion.div>
  );
};

/* ─── Main Organizer ─── */
export const Organizer = () => {
  const { venueState, dispatch } = useVenue();
  const { triggerSpike, triggerHalftimeRushCascade } = useSimulation();
  const [trendHistory, setTrendHistory] = useState({});
  const maxHistoryLength = 20;

  useEffect(() => {
    const allZones = [
      ...Object.entries(venueState.gates).map(([id, g]) => ({ id: `Gate ${id}`, val: g.congestion })),
      ...Object.entries(venueState.corridors).map(([id, c]) => ({ id, val: c.congestion })),
    ];
    const top5 = allZones.sort((a, b) => b.val - a.val).slice(0, 5);
    setTrendHistory(prev => {
      const next = {};
      top5.forEach(z => {
        next[z.id] = [...(prev[z.id] || Array(maxHistoryLength - 1).fill(10))];
        if (next[z.id].length >= maxHistoryLength) next[z.id].shift();
        next[z.id].push(z.val);
      });
      return next;
    });
  }, [venueState]);

  const handleApproveAdvisory = (rec) => {
    dispatch({ type: 'ADD_ADVISORY', payload: { id: Date.now(), message: rec.advisoryText, targetZone: rec.zone, sentAt: Date.now() } });
    dispatch({ type: 'UPDATE_AI_RECOMMENDATION', payload: { id: rec.id, updates: { approved: true } } });
  };

  const scenarioBtns = [
    {
      label: 'Gate A Rush', sub: 'Trigger 95% spike',
      icon: 'bolt', color: 'var(--status-caution)', bg: 'var(--status-caution-bg)', border: 'var(--status-caution-border)',
      action: () => triggerSpike('A', 'gate', {}),
    },
    {
      label: 'Halftime Cascade', sub: 'Simulate food rush',
      icon: 'restaurant', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)', border: 'var(--status-danger-border)',
      action: triggerHalftimeRushCascade,
    },
    {
      label: 'Corridor Blockage', sub: 'Trigger North Inner',
      icon: 'route', color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', border: 'var(--border-default)',
      action: () => triggerSpike('innerNorth', 'corridor', {}),
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page heading ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700,
              letterSpacing: 'var(--tracking-tight)', marginTop: 0, marginBottom: '4px',
            }}
          >
            Control Center
          </h1>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time venue operations overview · {venueState.eventName}
          </div>
        </div>
        <AIBadge />
      </div>

      {/* ── Scenario Trigger Buttons ── */}
      <div className="flex flex-wrap gap-3" role="group" aria-label="Scenario simulation controls">
        {scenarioBtns.map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="flex items-center gap-3 focus-ring"
            style={{
              background: btn.bg,
              border: `1px solid ${btn.border}`,
              color: btn.color,
              borderRadius: '10px',
              padding: '10px 18px',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">{btn.icon}</span>
            <div className="text-left">
              <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{btn.label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', opacity: 0.65, marginTop: '2px' }}>{btn.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── 3-col main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left: Zone Health (1 col) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div>
            <span
              style={{
                fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                color: 'var(--text-muted)', display: 'block', marginBottom: '12px',
              }}
            >
              Gate Health
            </span>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(venueState.gates).map(([id, g]) => (
                <GateZoneCard key={id} id={id} data={g} />
              ))}
            </div>
          </div>

          <div>
            <span
              style={{
                fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                color: 'var(--text-muted)', display: 'block', marginBottom: '10px',
              }}
            >
              Corridor Health
            </span>
            <div className="flex flex-col gap-2">
              {Object.entries(venueState.corridors)
                .sort((a, b) => b[1].congestion - a[1].congestion)
                .slice(0, 4)
                .map(([id, c]) => {
                  const color = getCongestionColor(c.congestion);
                  const status = getCongestionStatus(c.congestion);
                  return (
                    <div
                      key={id}
                      className="px-3 py-2.5 rounded-xl"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderLeft: `3px solid ${color}`,
                      }}
                      role="region"
                      aria-label={`${id}: ${c.congestion}% congestion`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          style={{
                            fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500,
                            color: 'var(--text-secondary)', textTransform: 'capitalize',
                          }}
                        >
                          {id.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color }}>
                          <AnimatedNumber value={c.congestion} suffix="%" />
                        </span>
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <CongestionMeter value={c.congestion} />
                      </div>
                      <span className="sr-only">{id} congestion: {c.congestion}%, status: {status}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Center: Alerts & Queue (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Active Bottleneck Alerts */}
          <Card role="region" aria-label="Active bottleneck alerts">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--status-danger)' }} aria-hidden="true">campaign</span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600,
                  letterSpacing: 'var(--tracking-normal)', margin: 0,
                }}
              >
                Active Bottleneck Alerts
              </h2>
              {venueState.activeAlerts.length > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--status-danger-bg)',
                    border: '1px solid var(--status-danger-border)',
                    color: 'var(--status-danger)',
                    borderRadius: '6px', padding: '2px 8px',
                    fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700,
                  }}
                >
                  {venueState.activeAlerts.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto scrollbar-hide pr-1">
              {venueState.activeAlerts.length === 0 ? (
                <div
                  className="text-center py-8 flex flex-col items-center gap-3"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--status-safe)' }} aria-hidden="true">check_circle</span>
                  No active alerts — all zones nominal
                </div>
              ) : (
                <AnimatePresence>
                  {venueState.activeAlerts.map(a => {
                    const isCrit = a.severity === 'critical';
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl"
                        style={{
                          background: isCrit ? 'var(--status-danger-bg)' : 'var(--status-warning-bg)',
                          border: `1px solid ${isCrit ? 'var(--status-danger-border)' : 'var(--status-warning-border)'}`,
                          borderLeft: `3px solid ${isCrit ? 'var(--status-danger)' : 'var(--status-warning)'}`,
                        }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            style={{
                              fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                              color: isCrit ? 'var(--status-danger)' : 'var(--status-warning)',
                            }}
                          >
                            {a.severity} Priority
                          </span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {a.message}
                        </div>
                        {isCrit && (
                          <button
                            className="mt-2 focus-ring"
                            style={{
                              fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                              color: 'var(--accent-blue-bright)',
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                          >
                            Dispatch Staff →
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </Card>

          {/* Live Queue Monitor */}
          <Card role="region" aria-label="Live queue monitor">
            <h3
              style={{
                fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600,
                letterSpacing: 'var(--tracking-normal)',
                marginBottom: '16px', marginTop: 0,
              }}
            >
              Live Queue Monitor
            </h3>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }} aria-label="Food stall wait times">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Facility', 'Zone', 'Wait', 'Action'].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          paddingBottom: '10px',
                          fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                          color: 'var(--text-muted)',
                          textAlign: i >= 2 ? 'right' : 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(venueState.foodStalls)
                    .sort((a, b) => b[1].waitTime - a[1].waitTime)
                    .map(([id, f]) => {
                      const waitColor = f.waitTime > 8 ? 'var(--status-danger)' : f.waitTime > 5 ? 'var(--status-caution)' : 'var(--status-safe)';
                      return (
                        <tr
                          key={id}
                          style={{ borderBottom: '1px solid var(--border-ghost)', transition: 'background 150ms' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {f.name}
                          </td>
                          <td style={{ padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {f.near}
                          </td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: waitColor }}>
                            {f.waitTime}m
                          </td>
                          <td style={{ padding: '10px 0', textAlign: 'right' }}>
                            {f.waitTime > 10 ? (
                              <button
                                className="focus-ring"
                                style={{
                                  fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                                  padding: '4px 10px', borderRadius: '8px',
                                  background: 'var(--status-caution-bg)',
                                  border: '1px solid var(--status-caution-border)',
                                  color: 'var(--status-caution)',
                                  cursor: 'pointer',
                                }}
                              >
                                Add Counter
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: AI Ops Recommendations (1 col) */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(20,184,166,0.04))',
              border: '1px solid var(--border-emphasis)',
              position: 'relative',
            }}
            role="region"
            aria-label="AI Ops Recommendations"
          >
            {/* Top shimmer */}
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.4) 50%, transparent)',
              }}
              aria-hidden="true"
            />

            <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--accent-blue)' }} aria-hidden="true">smart_toy</span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600,
                      color: 'var(--accent-blue-bright)', margin: 0,
                    }}
                  >
                    AI Ops Recommendations
                  </h3>
                </div>
                <AIBadge />
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <AnimatePresence>
                {venueState.aiRecommendations.filter(r => !r.dismissed).map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div
                      className="rounded-xl relative overflow-hidden"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {/* Approved overlay */}
                      {r.approved && (
                        <div
                          className="absolute inset-0 flex items-center justify-center z-10"
                          style={{
                            background: 'rgba(16,24,39,0.88)',
                            backdropFilter: 'blur(2px)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                              padding: '6px 12px', borderRadius: '100px',
                              background: 'var(--status-safe-bg)',
                              border: '1px solid var(--status-safe-border)',
                              color: 'var(--status-safe)',
                            }}
                          >
                            ✓ Broadcasted
                          </span>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            style={{
                              fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
                              color: 'var(--status-danger)',
                            }}
                          >
                            {r.urgency}
                          </span>
                          <AIBadge />
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600,
                            letterSpacing: 'var(--tracking-normal)',
                            marginBottom: '4px', color: 'var(--text-primary)',
                          }}
                        >
                          {r.action}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          {r.reason}
                        </div>
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'var(--bg-elevated)',
                            border: '1px dashed var(--border-subtle)',
                            fontFamily: 'var(--font-body)', fontSize: '11px',
                            fontStyle: 'italic',
                            color: 'var(--text-muted)',
                            marginBottom: '12px',
                            lineHeight: 1.5,
                          }}
                        >
                          "{r.advisoryText}"
                        </div>
                        {!r.approved && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveAdvisory(r)}
                              className="flex-1"
                              size="sm"
                            >
                              Approve & Broadcast
                            </Button>
                            <button
                              onClick={() => dispatch({ type: 'UPDATE_AI_RECOMMENDATION', payload: { id: r.id, updates: { dismissed: true } } })}
                              className="flex items-center justify-center focus-ring"
                              style={{
                                width: '32px', height: '32px',
                                borderRadius: '8px',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 150ms ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--status-danger-border)'; e.currentTarget.style.background = 'var(--status-danger-bg)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                              aria-label="Dismiss recommendation"
                            >
                              <span className="material-symbols-rounded" style={{ fontSize: '14px', color: 'var(--text-muted)' }} aria-hidden="true">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {venueState.aiRecommendations.filter(r => !r.dismissed).length === 0 && (
                <div className="text-center py-6 flex flex-col items-center gap-2">
                  <span className="material-symbols-rounded" style={{ fontSize: '24px', color: 'var(--status-safe)' }} aria-hidden="true">check_circle</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No AI recommendations at this time.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trend Chart ── */}
      <div
        className="rounded-2xl p-6 flex flex-col"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          height: '340px',
        }}
        role="region"
        aria-label="Congestion trend chart for highest congestion zones"
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600,
            letterSpacing: 'var(--tracking-normal)',
            marginBottom: '16px', marginTop: 0,
          }}
        >
          Highest Congestion Zones — Real-time Tracker
        </h3>
        <div
          className="flex-1 rounded-xl p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}
        >
          <CongestionTrendChart historyData={trendHistory} />
        </div>
      </div>

    </div>
  );
};
