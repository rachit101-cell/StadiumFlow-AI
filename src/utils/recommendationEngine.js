import { PHASES, CONGESTION } from '../constants/venue';

/**
 * Calculates the straight-line "ring distance" between two stadium sections.
 * Uses a circular ring model (A→H mapped to 0→7).
 *
 * @param {string} sec1 - First section label (e.g. 'A')
 * @param {string} sec2 - Second section label (e.g. 'D')
 * @returns {number} Distance in abstract ring units (0 = same, 8 = max half-ring)
 */
const sectionDistance = (sec1, sec2) => {
  if (!sec1 || !sec2) return 5;
  const ring = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const idx1 = ring.indexOf(sec1);
  const idx2 = ring.indexOf(sec2);
  if (idx1 < 0 || idx2 < 0) return 5;
  const diff = Math.abs(idx1 - idx2);
  return Math.min(diff, ring.length - diff) * 2;
};

/**
 * Gate proximity weights per section.
 * 1.0 = directly adjacent gate, 0.2 = far side of the stadium.
 */
const GATE_PROXIMITIES = {
  A: { A: 1, B: 0.8, C: 0.5, D: 0.2, E: 0.3, F: 0.8 },
  B: { A: 0.8, B: 1, C: 0.8, D: 0.4, E: 0.2, F: 0.5 },
  C: { A: 0.5, B: 0.8, C: 1, D: 0.8, E: 0.4, F: 0.2 },
  D: { A: 0.2, B: 0.4, C: 0.8, D: 1, E: 0.8, F: 0.3 },
  E: { A: 0.3, B: 0.2, C: 0.4, D: 0.8, E: 1, F: 0.8 },
  F: { A: 0.8, B: 0.5, C: 0.2, D: 0.3, E: 0.8, F: 1 },
  G: { A: 0.7, B: 0.4, C: 0.2, D: 0.4, E: 0.9, F: 1 },
  H: { A: 1, B: 0.7, C: 0.4, D: 0.2, E: 0.4, F: 0.8 },
};

/**
 * Generates a human-readable explanation for a recommendation.
 *
 * @param {'gate'|'food'|'washroom'|'exit'} type - The type of recommendation
 * @param {Object} rec - The recommended entity object
 * @param {Object} alt - The alternate entity object
 * @param {Object} userProfile - The current user profile
 * @returns {string} Explanation string
 */
const getExplanation = (type, rec, alt, userProfile) => {
  const { seatSection, accessibilityMode, wheelchairMode, familyGroupMode, foodPreference } = userProfile;
  if (type === 'gate') {
    if (accessibilityMode) return `Accessible route — stair-free path via Gate ${rec.id}`;
    return `Recommended for your section (${seatSection}) — Gate ${rec.id} is faster than Gate ${alt.id}`;
  }
  if (type === 'food') {
    if (foodPreference === 'veg') return `Vegetarian stalls only — filtered for your food preference`;
    if (familyGroupMode) return `Family route — avoids high-traffic corridors`;
    return `Recommended for your section (${seatSection}) — Wait time is only ${rec.waitTime} min`;
  }
  if (type === 'washroom') {
    if (wheelchairMode) return `Accessible route — stair-free path selected`;
    return `Recommended for your section (${seatSection}) — Closest with low queue`;
  }
  if (type === 'exit') {
    if (familyGroupMode && rec.parkingNearby) return `Family route — Chosen for easier group movement and parking proximity`;
    return `Recommended for your section (${seatSection}) — Shortest exit queue`;
  }
  return '';
};

/**
 * Calculates the optimal gate recommendation for a given user profile
 * and current venue state, scoring each gate by congestion and proximity.
 *
 * @param {Object} gates - Gate entries from venueState
 * @param {Object} userProfile - The user profile from UserContext
 * @returns {{ bestGate: Object, altGate: Object, gateExpl: string }}
 */
const scoreBestGate = (gates, userProfile) => {
  const { seatSection, accessibilityMode } = userProfile;
  const gateScores = Object.entries(gates)
    .map(([id, g]) => {
      if (accessibilityMode && !g.accessible) return { id, score: -1, ...g };
      const p = GATE_PROXIMITIES[seatSection]?.[id] || 0.5;
      return { id, score: (100 - g.congestion) * p, ...g };
    })
    .sort((a, b) => b.score - a.score);
  const bestGate = gateScores[0];
  const altGate = gateScores[1] || gateScores[0];
  const gateExpl = getExplanation('gate', bestGate, altGate, userProfile);
  return { bestGate, altGate, gateExpl };
};

/**
 * Calculates the optimal food stall recommendation based on wait time,
 * distance from the user's section, and food preference.
 *
 * @param {Object} foodStalls - Food stall entries from venueState
 * @param {Object} userProfile - The user profile from UserContext
 * @returns {{ bestFood: Object, altFood: Object, foodExpl: string }}
 */
const scoreBestFood = (foodStalls, userProfile) => {
  const { seatSection, foodPreference, familyGroupMode } = userProfile;
  const foodScores = Object.entries(foodStalls)
    .map(([id, f]) => {
      if (foodPreference !== 'any' && !f.type.includes(foodPreference)) return { id, score: -1, ...f };
      const distance = sectionDistance(seatSection, f.section);
      const s = (100 - f.waitTime * 3) + (100 - distance * 5);
      return { id, score: s, ...f, distanceUnits: distance };
    })
    .sort((a, b) => b.score - a.score);
  const bestFood = foodScores[0];
  const altFood = foodScores[1] || foodScores[0];
  const foodExpl = getExplanation('food', bestFood, altFood, userProfile);
  return { bestFood, altFood, foodExpl };
};

/**
 * Calculates the optimal washroom recommendation based on wait time,
 * distance from the user's section, and wheelchair accessibility requirements.
 *
 * @param {Object} washrooms - Washroom entries from venueState
 * @param {Object} userProfile - The user profile from UserContext
 * @returns {{ bestWashroom: Object, altWash: Object, washExpl: string }}
 */
const scoreBestWashroom = (washrooms, userProfile) => {
  const { seatSection, wheelchairMode } = userProfile;
  const washScores = Object.entries(washrooms)
    .map(([id, w]) => {
      if (wheelchairMode && !w.accessible) return { id, score: -1, ...w };
      const distance = sectionDistance(seatSection, w.section);
      const s = (100 - w.waitTime * 4) + (100 - distance * 4);
      return { id, score: s, ...w, distanceUnits: distance };
    })
    .sort((a, b) => b.score - a.score);
  const bestWashroom = washScores[0];
  const altWash = washScores[1] || washScores[0];
  const washExpl = getExplanation('washroom', bestWashroom, altWash, userProfile);
  return { bestWashroom, altWash, washExpl };
};

/**
 * Calculates the optimal exit recommendation based on crowd level, ETA,
 * and optional parking/family preferences.
 *
 * @param {Object} exits - Exit entries from venueState
 * @param {Object} userProfile - The user profile from UserContext
 * @returns {{ bestExit: Object, altExit: Object, exitExpl: string }}
 */
const scoreBestExit = (exits, userProfile) => {
  const { familyGroupMode } = userProfile;
  const exitScores = Object.entries(exits)
    .map(([id, e]) => {
      let s = (100 - e.crowdLevel) + (100 - e.etaMinutes * 6);
      if (familyGroupMode && e.parkingNearby) s += 15;
      return { id, score: s, ...e };
    })
    .sort((a, b) => b.score - a.score);
  const bestExit = exitScores[0];
  const altExit = exitScores[1] || exitScores[0];
  const exitExpl = getExplanation('exit', bestExit, altExit, userProfile);
  return { bestExit, altExit, exitExpl };
};

/**
 * Determines whether the user should leave their seat immediately to beat
 * the rush, based on food stall congestion and corridor conditions.
 *
 * @param {string} eventPhase - Current event phase
 * @param {Object} bestFood - Best food recommendation
 * @param {Object} corridors - Corridor congestion data from venueState
 * @returns {{ shouldLeaveNow: boolean, leaveAdvice: string }}
 */
const calcShouldLeave = (eventPhase, bestFood, corridors) => {
  let shouldLeaveNow = false;
  if (eventPhase === PHASES.LIVE_MATCH) {
    if (bestFood.score > -1 && bestFood.crowdLevel > CONGESTION.MEDIUM_MAX && corridors.innerNorth.congestion < 50) {
      shouldLeaveNow = true;
    }
  }
  return {
    shouldLeaveNow,
    leaveAdvice: shouldLeaveNow
      ? 'Queue levels are rising rapidly. Go now to save 10+ minutes.'
      : 'Wait for halftime',
  };
};

/**
 * Main recommendation engine. Calculates optimal gate, food stall, washroom,
 * exit, and routing recommendations given the current venue state and user profile.
 *
 * @param {Object} venueState - The current venue state from VenueContext
 * @param {Object} userProfile - The user profile from UserContext
 * @returns {{
 *   bestGate: Object,
 *   bestRoute: Object,
 *   bestFood: Object,
 *   bestWashroom: Object,
 *   bestExit: Object,
 *   shouldLeaveNow: boolean,
 *   leaveAdvice: string,
 * }}
 */
export const getRecommendations = (venueState, userProfile) => {
  const { eventPhase, gates, corridors, foodStalls, washrooms, exits } = venueState;
  const { seatSection } = userProfile;

  const { bestGate, altGate, gateExpl } = scoreBestGate(gates, userProfile);
  const { bestFood, altFood, foodExpl } = scoreBestFood(foodStalls, userProfile);
  const { bestWashroom, altWash, washExpl } = scoreBestWashroom(washrooms, userProfile);
  const { bestExit, altExit, exitExpl } = scoreBestExit(exits, userProfile);

  const bestRoute = {
    path: [bestGate.id, `${bestGate.id}-Inner-Ring`, `Section ${seatSection}`],
    etaMinutes: (bestGate.eta || 4) + 4,
    reason: gateExpl,
    accessibleVariant: userProfile.accessibilityMode,
  };

  const { shouldLeaveNow, leaveAdvice } = calcShouldLeave(eventPhase, bestFood, corridors);

  return {
    bestGate:    { ...bestGate, reason: gateExpl, alternate: altGate.id },
    bestRoute,
    bestFood:    { ...bestFood, reason: foodExpl, alternate: altFood.id },
    bestWashroom: { ...bestWashroom, reason: washExpl, alternate: altWash.id },
    bestExit:    { ...bestExit, reason: exitExpl, alternate: altExit.id },
    shouldLeaveNow,
    leaveAdvice,
  };
};
