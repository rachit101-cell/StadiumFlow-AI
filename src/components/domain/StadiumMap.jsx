import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useVenue } from '../../contexts/VenueContext';

/* ============================================================
   CONSTANTS — coordinate system: 1000 × 820
   ============================================================ */
const W = 1000, H = 820;
const CX = 500, CY = 410;          // stadium centre
const RX_OUTER = 370, RY_OUTER = 270;  // outer bowl
const RX_INNER = 240, RY_INNER = 160;  // inner corridor outer edge
const RX_PITCH = 195, RY_PITCH = 130;  // pitch/field

/* Sections — 8 equal wedges. Angles measured clockwise from top (North) */
const SECTIONS = [
  { id: 'A', midAngle: 0    },   // North
  { id: 'B', midAngle: 45   },   // NE
  { id: 'C', midAngle: 90   },   // East
  { id: 'D', midAngle: 135  },   // SE
  { id: 'E', midAngle: 180  },   // South
  { id: 'F', midAngle: 225  },   // SW
  { id: 'G', midAngle: 270  },   // West
  { id: 'H', midAngle: 315  },   // NW
];

/* Gates — anchored on the outer-bowl ellipse */
const GATES = {
  A: { angle: 0,   label: 'Gate A', dir: 'N' },
  B: { angle: 45,  label: 'Gate B', dir: 'NE' },
  C: { angle: 90,  label: 'Gate C', dir: 'E' },
  D: { angle: 135, label: 'Gate D', dir: 'SE' },
  E: { angle: 180, label: 'Gate E', dir: 'S' },
  F: { angle: 225, label: 'Gate F', dir: 'SW' },
};

/* Facility definitions — placed around the inner corridor */
const FACILITIES = [
  { id: 'F1', type: 'food',     icon: '🍕', angle: 20,  r: 0.87, label: 'Food N1' },
  { id: 'F2', type: 'food',     icon: '🌮', angle: 160, r: 0.87, label: 'Food S1' },
  { id: 'F3', type: 'food',     icon: '🥤', angle: 260, r: 0.87, label: 'Food W1' },
  { id: 'W1', type: 'washroom', icon: '🚻', angle: 350, r: 0.87, label: 'WC North' },
  { id: 'W2', type: 'washroom', icon: '🚻', angle: 100, r: 0.87, label: 'WC East'  },
  { id: 'W3', type: 'washroom', icon: '🚻', angle: 220, r: 0.87, label: 'WC West'  },
  { id: 'M1', type: 'medical',  icon: '🏥', angle: 290, r: 0.87, label: 'Medical'  },
];

/* Exit zones — outside the stadium */
const EXIT_ZONES = [
  { id: 'north', label: 'North Exit', angle: 0,   dist: 1.22 },
  { id: 'east',  label: 'East Exit',  angle: 90,  dist: 1.22 },
  { id: 'south', label: 'South Exit', angle: 180, dist: 1.22 },
  { id: 'west',  label: 'West Exit',  angle: 270, dist: 1.22 },
];

/* ============================================================
   UTILS
   ============================================================ */
/** Convert angle-from-north (CW) + radii to Cartesian */
const polar = (angleDeg, rx, ry, cx = CX, cy = CY) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
};

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Congestion → fill color (new design system) */
const congestionFill = (v) => {
  if (v >= 81) return { fill: '#EF4444', opacity: 0.30 };
  if (v >= 66) return { fill: '#F97316', opacity: 0.25 };
  if (v >= 41) return { fill: '#F59E0B', opacity: 0.20 };
  return { fill: '#10B981', opacity: 0.15 };
};

/** Congestion → stroke color */
const congestionStroke = (v) => {
  if (v >= 81) return '#EF4444';
  if (v >= 66) return '#F97316';
  if (v >= 41) return '#F59E0B';
  return '#10B981';
};

/* ============================================================
   SVG SUB-COMPONENTS
   ============================================================ */

/** One seating section wedge */
const SectionWedge = ({ section, congestion, isOrigin, isDestination }) => {
  const SPAN = 45;
  const start = section.midAngle - SPAN / 2;
  const end   = section.midAngle + SPAN / 2;

  const gap = 2; // visual gap between wedges
  const s1 = polar(start + gap, RX_OUTER, RY_OUTER);
  const s2 = polar(end   - gap, RX_OUTER, RY_OUTER);
  const s3 = polar(end   - gap, RX_INNER, RY_INNER);
  const s4 = polar(start + gap, RX_INNER, RY_INNER);

  const d = [
    `M ${s1.x} ${s1.y}`,
    `A ${RX_OUTER} ${RY_OUTER} 0 0 1 ${s2.x} ${s2.y}`,
    `L ${s3.x} ${s3.y}`,
    `A ${RX_INNER} ${RY_INNER} 0 0 0 ${s4.x} ${s4.y}`,
    'Z',
  ].join(' ');

  const { fill, opacity } = congestionFill(congestion);
  const isCrit = congestion >= 81;
  const isHigh  = congestion >= 66 && congestion < 81;

  // Label position — at 82% between inner and outer
  const labelR = 0.82;
  const lp = polar(section.midAngle, lerp(RX_INNER, RX_OUTER, labelR), lerp(RY_INNER, RY_OUTER, labelR));

  const baseStroke = isOrigin ? '#60A5FA' : isDestination ? '#2DD4BF' : '#1E2D45';
  const baseStrokeW = isOrigin || isDestination ? 3 : 1.5;

  return (
    <g className={isCrit && !isOrigin && !isDestination ? 'zone-breathe-critical' : isHigh && !isOrigin && !isDestination ? 'zone-high' : ''}>
      {/* Section base */}
      <path d={d} fill="#192035" stroke={baseStroke} strokeWidth={baseStrokeW} />
      {/* Congestion overlay */}
      <path d={d} fill={fill} fillOpacity={opacity} stroke="none" />
      {/* Highlight ring for origin/destination */}
      {(isOrigin || isDestination) && (
        <path d={d} fill="none"
          stroke={isOrigin ? '#3B82F6' : '#14B8A6'}
          strokeWidth="3"
          strokeDasharray={isDestination ? '6 3' : ''}
          opacity={0.9}
        />
      )}
      {/* Label */}
      <text x={lp.x} y={lp.y + 5}
        fill={isOrigin ? '#60A5FA' : isDestination ? '#2DD4BF' : '#94A3B8'}
        fontSize={isOrigin || isDestination ? '17' : '15'}
        fontWeight={isOrigin || isDestination ? '700' : '600'}
        textAnchor="middle"
        fontFamily="Space Grotesk, Inter, sans-serif"
      >
        {section.id}
      </text>
    </g>
  );
};

/** Gate marker on ellipse boundary — with congestion-change ripple */
const GateMarker = ({ gateId, gateDef, congestion }) => {
  const pos = polar(gateDef.angle, RX_OUTER + 10, RY_OUTER + 10);
  const labelPos = polar(gateDef.angle, RX_OUTER + 44, RY_OUTER + 44);
  const color = congestion >= 75 ? '#EF4444' : congestion >= 50 ? '#F97316' : '#10B981';
  const glowColor = congestion >= 75 ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)';

  const [rippling, setRippling] = useState(false);
  const prevCongRef = useRef(congestion);

  useEffect(() => {
    if (prevCongRef.current !== congestion) {
      prevCongRef.current = congestion;
      setRippling(true);
      const t = setTimeout(() => setRippling(false), 1100);
      return () => clearTimeout(t);
    }
  }, [congestion]);

  return (
    <g>
      {/* Glow ring */}
      <circle cx={pos.x} cy={pos.y} r="18" fill={glowColor} />
      {/* Gate circle */}
      <circle cx={pos.x} cy={pos.y} r="13" fill={color} stroke="#080B12" strokeWidth="2.5" />
      {/* Ripple on congestion change */}
      {rippling && (
        <circle cx={pos.x} cy={pos.y} r="4"
          fill="none" stroke={color} strokeWidth="2"
          className="gate-ripple-circle"
        />
      )}
      {/* Gate ID */}
      <text x={pos.x} y={pos.y + 5}
        fill="#fff" fontSize="12" fontWeight="700"
        textAnchor="middle" fontFamily="Space Grotesk, sans-serif"
      >
        {gateId}
      </text>
      {/* Label outside */}
      <text x={labelPos.x} y={labelPos.y + 4}
        fill="#94A3B8" fontSize="11" fontWeight="600"
        textAnchor="middle" fontFamily="Inter, sans-serif"
      >
        {gateDef.dir}
      </text>
      {/* Congestion % */}
      <text x={labelPos.x} y={labelPos.y + 17}
        fill={color} fontSize="11" fontWeight="700"
        textAnchor="middle" fontFamily="Space Grotesk, sans-serif"
      >
        {congestion}%
      </text>
    </g>
  );
};

/** Facility hexagon marker */
const FacilityMarker = ({ fac, isTarget }) => {
  const rx = lerp(RX_INNER, RX_OUTER, fac.r);
  const ry = lerp(RY_INNER, RY_OUTER, fac.r);
  const pos = polar(fac.angle, rx, ry);

  const colors = {
    food:     { border: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    washroom: { border: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    medical:  { border: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
  };
  const c = colors[fac.type] || colors.food;
  const size = 18;

  return (
    <g>
      <circle cx={pos.x} cy={pos.y} r={size + (isTarget ? 6 : 0)}
        fill={isTarget ? c.border : c.bg}
        fillOpacity={isTarget ? 0.25 : 1}
        stroke={c.border}
        strokeWidth={isTarget ? 2.5 : 1.5}
      />
      <text x={pos.x} y={pos.y + 8}
        fontSize={isTarget ? '18' : '14'}
        textAnchor="middle"
      >
        {fac.icon}
      </text>
      {isTarget && (
        <text x={pos.x} y={pos.y + size + 16}
          fill={c.border} fontSize="10" fontWeight="600"
          textAnchor="middle" fontFamily="Inter, sans-serif"
        >
          {fac.label}
        </text>
      )}
    </g>
  );
};

/** Exit zone marker outside ellipse */
const ExitMarker = ({ exit, isTarget }) => {
  const pos = polar(exit.angle, RX_OUTER * exit.dist, RY_OUTER * exit.dist);
  return (
    <g>
      <rect x={pos.x - 36} y={pos.y - 14} width="72" height="28" rx="6"
        fill={isTarget ? 'rgba(20,184,166,0.2)' : 'rgba(22,31,46,0.9)'}
        stroke={isTarget ? '#14B8A6' : '#1E2D45'}
        strokeWidth={isTarget ? 2 : 1}
      />
      <text x={pos.x} y={pos.y + 5}
        fill={isTarget ? '#2DD4BF' : '#475569'} fontSize="11" fontWeight="700"
        textAnchor="middle" fontFamily="Inter, sans-serif"
      >
        {exit.label}
      </text>
    </g>
  );
};

/* ============================================================
   ROUTING ENGINE — returns an SVG path string from origin to dest
   Both origin and dest are {x, y} coordinate objects
   Uses a multi-waypoint cubic bezier that:
   1. Starts at origin section centroid (mid-arc of origin wedge)
   2. Curves through the inner corridor ring
   3. Arrives at destination
   ============================================================ */
const buildRoute = (originSection, destType, recs, venueState) => {
  if (!originSection || !recs) return null;

  const SECTION = SECTIONS.find(s => s.id === originSection);
  if (!SECTION) return null;

  // Origin point — centre of the origin section stand (at 75% between inner & outer)
  const oRx = lerp(RX_INNER, RX_OUTER, 0.75);
  const oRy = lerp(RY_INNER, RY_OUTER, 0.75);
  const origin = polar(SECTION.midAngle, oRx, oRy);

  // Waypoint — inner ring entry of origin (just inside the inner corridor)
  const wp1Rx = RX_INNER - 20;
  const wp1Ry = RY_INNER - 14;
  const wp1 = polar(SECTION.midAngle, wp1Rx, wp1Ry);

  // Centre of pitch area (used as a through-point for cross-stadium paths)
  const centre = { x: CX, y: CY };

  let dest = null;
  let routeColor = '#3B82F6';
  let lineStyle  = 'solid';

  if (destType === 'Seat' && recs.bestGate) {
    // Route: current section → inner corridor → gate
    const gate = GATES[recs.bestGate.id];
    if (!gate) return null;
    dest = polar(gate.angle, RX_OUTER + 10, RY_OUTER + 10);
    routeColor = '#3B82F6';

  } else if (destType === 'Food' && recs.bestFood) {
    const fac = FACILITIES.find(f => f.id === recs.bestFood.id) || FACILITIES.find(f => f.type === 'food');
    if (!fac) return null;
    const rx = lerp(RX_INNER, RX_OUTER, fac.r);
    const ry = lerp(RY_INNER, RY_OUTER, fac.r);
    dest = polar(fac.angle, rx, ry);
    routeColor = '#F59E0B';

  } else if (destType === 'Washroom' && recs.bestWashroom) {
    const fac = FACILITIES.find(f => f.id === recs.bestWashroom.id) || FACILITIES.find(f => f.type === 'washroom');
    if (!fac) return null;
    const rx = lerp(RX_INNER, RX_OUTER, fac.r);
    const ry = lerp(RY_INNER, RY_OUTER, fac.r);
    dest = polar(fac.angle, rx, ry);
    routeColor = '#3B82F6';

  } else if (destType === 'Exit' && recs.bestExit) {
    const ez = EXIT_ZONES.find(e => e.id === recs.bestExit.id) || EXIT_ZONES[0];
    dest = polar(ez.angle, RX_OUTER * ez.dist, RY_OUTER * ez.dist);
    routeColor = '#14B8A6';
    lineStyle = 'dashed';
  }

  if (!dest) return null;

  // Decide whether route needs to cross through centre
  const angleDiff = Math.abs(SECTION.midAngle - (
    destType === 'Seat' ? (GATES[recs.bestGate?.id]?.angle ?? 0) :
    destType === 'Exit' ? (EXIT_ZONES.find(e => e.id === recs.bestExit?.id)?.angle ?? 0) :
    SECTION.midAngle
  ));
  const crossCentre = angleDiff > 100 && angleDiff < 260;

  let pathD;
  if (crossCentre) {
    // Multi-segment path: origin → wp1 → centre → dest
    pathD = `M ${origin.x} ${origin.y} C ${wp1.x} ${wp1.y}, ${lerp(wp1.x, centre.x, 0.6)} ${lerp(wp1.y, centre.y, 0.6)}, ${centre.x} ${centre.y} S ${lerp(centre.x, dest.x, 0.6)} ${lerp(centre.y, dest.y, 0.6)}, ${dest.x} ${dest.y}`;
  } else {
    // Simple quadratic: origin → wp1 (inner ring) → dest
    const cpx = lerp(wp1.x, dest.x, 0.45);
    const cpy = lerp(wp1.y, dest.y, 0.45);
    pathD = `M ${origin.x} ${origin.y} Q ${wp1.x} ${wp1.y}, ${cpx} ${cpy} T ${dest.x} ${dest.y}`;
  }

  // Arrowhead direction at destination
  const arrLen = 12, arrW = 7;
  // Approximate direction from second-to-last point to dest
  const prevPx = crossCentre ? lerp(centre.x, dest.x, 0.6) : lerp(wp1.x, dest.x, 0.45);
  const prevPy = crossCentre ? lerp(centre.y, dest.y, 0.6) : lerp(wp1.y, dest.y, 0.45);
  const dx = dest.x - prevPx, dy = dest.y - prevPy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len, ny = dy / len;
  const px = -ny, py = nx;
  const arrowTip = { x: dest.x + nx * 4, y: dest.y + ny * 4 };
  const arrowL   = { x: dest.x - nx * arrLen + px * arrW, y: dest.y - ny * arrLen + py * arrW };
  const arrowR   = { x: dest.x - nx * arrLen - px * arrW, y: dest.y - ny * arrLen - py * arrW };
  const arrowPath = `M ${arrowTip.x} ${arrowTip.y} L ${arrowL.x} ${arrowL.y} L ${arrowR.x} ${arrowR.y} Z`;

  return { pathD, arrowPath, routeColor, lineStyle, origin, dest };
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export const StadiumMap = ({ routeCategory = 'Seat', recs = null }) => {
  const { venueState } = useVenue();
  const [routeKey, setRouteKey] = useState(0);
  const [showTraveler, setShowTraveler] = useState(false);

  // Re-trigger draw animation on category change; reset traveler
  useEffect(() => {
    setShowTraveler(false);
    setRouteKey(k => k + 1);
    const t = setTimeout(() => setShowTraveler(true), 1200);
    return () => clearTimeout(t);
  }, [routeCategory]);

  const seatSection = recs?._originSection || 'E'; // fallback

  // Figure out which section is the origin (user's seat)
  // We'll use the bestGate's connected section or a fixed origin
  const originSectionId = recs?.bestGate?.id ? // The user's seat section
    (venueState.sections ? Object.keys(venueState.sections)[0] : 'E') : 'E';

  // In practice we pull from userProfile via NavigateView — it passes it in recs._originSection
  // fallback to 'E' for demo
  const originId = seatSection;

  const route = useMemo(() => buildRoute(originId, routeCategory, recs, venueState),
    [originId, routeCategory, recs, venueState]);

  // Destination section for highlight
  const destSectionId = destType => {
    if (destType === 'Seat' && recs?.bestGate) {
      // section adjacent to best gate
      const gateAngle = GATES[recs.bestGate.id]?.angle ?? 0;
      return SECTIONS.reduce((closest, s) => {
        const da = Math.abs(s.midAngle - gateAngle);
        const daPrev = Math.abs(closest.midAngle - gateAngle);
        return da < daPrev ? s : closest;
      }, SECTIONS[0]).id;
    }
    return null;
  };

  const highlightDest = destSectionId(routeCategory);

  // Label helpers based on active category
  const routeLabel = () => {
    if (!recs) return '';
    switch (routeCategory) {
      case 'Seat':     return `Section ${originId} → Gate ${recs.bestGate?.id} → Your Seat`;
      case 'Food':     return `Section ${originId} → ${recs.bestFood?.name}`;
      case 'Washroom': return `Section ${originId} → ${recs.bestWashroom?.label}`;
      case 'Exit':     return `Section ${originId} → ${recs.bestExit?.label}`;
      default: return '';
    }
  };

  const targetFacility = (() => {
    if (routeCategory === 'Food') {
      return FACILITIES.find(f => f.id === recs?.bestFood?.id) ?? FACILITIES.find(f => f.type === 'food');
    }
    if (routeCategory === 'Washroom') {
      return FACILITIES.find(f => f.id === recs?.bestWashroom?.id) ?? FACILITIES.find(f => f.type === 'washroom');
    }
    return null;
  })();

  const targetExit = routeCategory === 'Exit'
    ? (EXIT_ZONES.find(e => e.id === recs?.bestExit?.id) ?? EXIT_ZONES[0])
    : null;

  const targetGateId = routeCategory === 'Seat' ? recs?.bestGate?.id : null;

  return (
    <div
      className="stadium-map-container w-full h-full relative"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1200px',
      }}
    >
      {/* Ambient shadow below map */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '10% 5%',
          bottom: '-8%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)',
          zIndex: 0,
        }}
      />
      {/* Scanlines overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="stadium-map-svg w-full h-full relative z-10"
        role="img"
        aria-label={`Stadium navigation map: ${routeLabel()}`}
        style={{
          background: '#080B12',
          transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'perspective(1200px) rotateX(3deg) rotateY(0deg) scale(1.01)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
        }}
      >
      <defs>
        {/* Glow filters */}
        <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="gate-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Animated gradient along route */}
        <linearGradient id="route-grad" gradientUnits="userSpaceOnUse"
          x1={route?.origin?.x ?? CX} y1={route?.origin?.y ?? CY}
          x2={route?.dest?.x ?? CX}   y2={route?.dest?.y ?? CY}
        >
          <stop offset="0%"   stopColor={route?.routeColor ?? '#3B82F6'} stopOpacity="0.5" />
          <stop offset="60%"  stopColor={route?.routeColor ?? '#3B82F6'} stopOpacity="1" />
          <stop offset="100%" stopColor={route?.routeColor === '#14B8A6' ? '#2DD4BF' : '#60A5FA'} stopOpacity="1" />
        </linearGradient>
        {/* Radial pitch gradient */}
        <radialGradient id="pitch-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0A6E3A" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>
        {/* Outer background gradient */}
        <radialGradient id="venue-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stopColor="#0F1826" />
          <stop offset="100%" stopColor="#080B12" />
        </radialGradient>
      </defs>

      {/* ── Background ── */}
      <rect x="0" y="0" width={W} height={H} fill="url(#venue-bg)" />

      {/* ── Outer parking zone labels ── */}
      {[
        { x: CX, y: 28,     t: 'North Parking',  angle: 0     },
        { x: CX, y: H - 14, t: 'South Parking',  angle: 0     },
        { x: 22, y: CY,     t: 'West Parking',   angle: -90   },
        { x: W-22, y: CY,   t: 'East Parking',   angle: 90    },
      ].map(l => (
        <text key={l.t} x={l.x} y={l.y}
          fill="#475569" fontSize="13" fontWeight="600"
          textAnchor="middle" fontFamily="Inter, sans-serif"
          transform={l.angle ? `rotate(${l.angle} ${l.x} ${l.y})` : undefined}
        >
          {l.t}
        </text>
      ))}

      {/* ── Outer stadium outline ── */}
      <ellipse cx={CX} cy={CY} rx={RX_OUTER + 22} ry={RY_OUTER + 22}
        fill="none" stroke="#162035" strokeWidth="30" />
      <ellipse cx={CX} cy={CY} rx={RX_OUTER + 22} ry={RY_OUTER + 22}
        fill="none" stroke="#1E2D45" strokeWidth="1.5" />

      {/* ── Outer corridor ring — colour by congestion ── */}
      <ellipse cx={CX} cy={CY} rx={RX_OUTER} ry={RY_OUTER}
        fill="none"
        stroke={congestionStroke(venueState.corridors?.northRing?.congestion ?? 30)}
        strokeWidth="22"
        strokeOpacity="0.15"
      />

      {/* ── Seating sections ── */}
      {SECTIONS.map(s => {
        const sData = venueState.sections?.[s.id];
        const gateId = sData?.gate;
        const congestion = venueState.gates?.[gateId]?.congestion ?? 20;
        return (
          <SectionWedge
            key={s.id}
            section={s}
            congestion={congestion}
            isOrigin={s.id === originId}
            isDestination={s.id === highlightDest && routeCategory === 'Seat'}
          />
        );
      })}

      {/* ── Inner corridor ring ── */}
      <ellipse cx={CX} cy={CY} rx={RX_INNER} ry={RY_INNER}
        fill="#0D1117"
        stroke={congestionStroke(venueState.corridors?.innerNorth?.congestion ?? 30)}
        strokeWidth="14"
        strokeOpacity="0.2"
      />
      <ellipse cx={CX} cy={CY} rx={RX_INNER} ry={RY_INNER}
        fill="none" stroke="#1E2D45" strokeWidth="1" />

      {/* ── Pitch / field ── */}
      <ellipse cx={CX} cy={CY} rx={RX_PITCH} ry={RY_PITCH}
        fill="url(#pitch-grad)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
      {/* Centre circle */}
      <circle cx={CX} cy={CY} r={38}
        fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      {/* Half-way line */}
      <line x1={polar(0, 0, RY_PITCH).x} y1={polar(0, 0, RY_PITCH).y}
        x2={polar(180, 0, RY_PITCH).x}   y2={polar(180, 0, RY_PITCH).y}
        stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      {/* Penalty boxes */}
      <rect x={CX - 80} y={CY - RY_PITCH} width="160" height="46" rx="3"
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
      <rect x={CX - 80} y={CY + RY_PITCH - 46} width="160" height="46" rx="3"
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
      {/* PITCH label */}
      <text x={CX} y={CY + 5}
        fill="rgba(255,255,255,0.3)" fontSize="13" fontWeight="700"
        textAnchor="middle" fontFamily="Space Grotesk, sans-serif"
        letterSpacing="4"
      >
        PITCH
      </text>

      {/* ── Gate markers ── */}
      {Object.entries(GATES).map(([gateId, gateDef]) => (
        <GateMarker
          key={gateId}
          gateId={gateId}
          gateDef={gateDef}
          congestion={venueState.gates?.[gateId]?.congestion ?? 20}
        />
      ))}

      {/* ── Facility markers ── */}
      {FACILITIES.map(fac => (
        <FacilityMarker
          key={fac.id}
          fac={fac}
          isTarget={
            (routeCategory === 'Food'     && targetFacility?.id === fac.id) ||
            (routeCategory === 'Washroom' && targetFacility?.id === fac.id)
          }
        />
      ))}

      {/* ── Exit zone markers ── */}
      {EXIT_ZONES.map(exit => (
        <ExitMarker key={exit.id} exit={exit} isTarget={targetExit?.id === exit.id} />
      ))}

      {/* ── ORIGIN MARKER (user position) ── */}
      {route && (
        <g>
          <circle cx={route.origin.x} cy={route.origin.y} r="14"
            fill="rgba(59,130,246,0.2)" stroke="#3B82F6" strokeWidth="2.5"
          />
          <circle cx={route.origin.x} cy={route.origin.y} r="7"
            fill="#3B82F6"
          />
          {/* Pulsing ring */}
          <circle cx={route.origin.x} cy={route.origin.y} r="18"
            fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6"
            className="animate-ping"
          />
          <text x={route.origin.x} y={route.origin.y - 22}
            fill="#60A5FA" fontSize="11" fontWeight="700"
            textAnchor="middle" fontFamily="Inter, sans-serif"
          >
            📍 You
          </text>
        </g>
      )}

      {/* ── DESTINATION MARKER ── */}
      {route && (
        <g>
          <circle cx={route.dest.x} cy={route.dest.y} r="14"
            fill={`${route.routeColor}33`} stroke={route.routeColor} strokeWidth="2.5"
          />
          <circle cx={route.dest.x} cy={route.dest.y} r="6"
            fill={route.routeColor}
          />
          <text x={route.dest.x} y={route.dest.y - 22}
            fill={route.routeColor} fontSize="11" fontWeight="700"
            textAnchor="middle" fontFamily="Inter, sans-serif"
          >
            🏁 Dest
          </text>
        </g>
      )}

      {/* ── ROUTE PATH — animated draw ── */}
      {route && (
        <g key={`route-${routeKey}`} filter="url(#route-glow)">
          {/* Glow shadow */}
          <path
            d={route.pathD}
            fill="none"
            stroke={route.routeColor}
            strokeOpacity="0.3"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Main route line */}
          <path
            id={`route-path-${routeKey}`}
            d={route.pathD}
            fill="none"
            stroke="url(#route-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={route.lineStyle === 'dashed' ? '12 6' : undefined}
            className="path-draw"
          />
          {/* Arrowhead at destination */}
          <path
            d={route.arrowPath}
            fill={route.routeColor}
            stroke="none"
          />
          {/* Traveling dot — appears after route draw completes */}
          {showTraveler && (
            <circle r="7" fill={route.routeColor} fillOpacity="0.9">
              <animateMotion
                dur="3.5s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href={`#route-path-${routeKey}`} />
              </animateMotion>
            </circle>
          )}
        </g>
      )}

      {/* ── Route Label Banner ── */}
      {route && (
        <g>
          <rect x={CX - 180} y={H - 58} width="360" height="34" rx="8"
            fill="rgba(22,31,46,0.92)"
            stroke={route.routeColor}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <text x={CX} y={H - 35}
            fill={route.routeColor} fontSize="12" fontWeight="600"
            textAnchor="middle" fontFamily="Inter, sans-serif"
          >
            {routeLabel()}
          </text>
        </g>
      )}

      {/* ── Corridor congestion legend (bottom-right) ── */}
      <g>
        <rect x={W - 175} y={54} width="162" height="82" rx="8"
          fill="rgba(13,17,23,0.88)" stroke="#1E2D45" strokeWidth="1" />
        <text x={W - 94} y={74}
          fill="#94A3B8" fontSize="10" fontWeight="600"
          textAnchor="middle" fontFamily="Inter, sans-serif"
          letterSpacing="1"
        >
          INNER CORRIDOR
        </text>
        {[
          { label: 'N Inner', val: venueState.corridors?.innerNorth?.congestion ?? 30, y: 90  },
          { label: 'S Inner', val: venueState.corridors?.innerSouth?.congestion ?? 25, y: 107 },
          { label: 'Ring',    val: venueState.corridors?.northRing?.congestion ?? 40,  y: 124 },
        ].map(row => {
          const c = congestionStroke(row.val);
          return (
            <g key={row.label}>
              <text x={W - 168} y={row.y}
                fill="#475569" fontSize="10" fontFamily="Inter, sans-serif">{row.label}</text>
              <rect x={W - 108} y={row.y - 9} width={60 * row.val / 100} height="7" rx="3.5"
                fill={c} fillOpacity="0.8" />
              <text x={W - 18} y={row.y}
                fill={c} fontSize="10" fontWeight="700"
                textAnchor="end" fontFamily="Space Grotesk, sans-serif"
              >
                {row.val}%
              </text>
            </g>
          );
        })}
      </g>
    </svg>
    </div>
  );
};
