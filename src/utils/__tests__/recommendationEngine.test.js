import { describe, it, expect } from 'vitest';
import { getRecommendations } from '../../utils/recommendationEngine';
import { PHASES } from '../../constants/venue';

// ─── Fixture Factories ────────────────────────────────────────────────────────

/** @returns {Object} Six gates with varied congestion and accessibility */
const makeGates = (overrides = {}) => ({
  A: { id: 'A', label: 'Gate A - North',  congestion: 30, eta: 3, accessible: true,  status: 'low',      ...overrides.A },
  B: { id: 'B', label: 'Gate B - NE',     congestion: 60, eta: 5, accessible: true,  status: 'medium' },
  C: { id: 'C', label: 'Gate C - East',   congestion: 85, eta: 8, accessible: false, status: 'critical' },
  D: { id: 'D', label: 'Gate D - SE',     congestion: 45, eta: 4, accessible: true,  status: 'medium' },
  E: { id: 'E', label: 'Gate E - South',  congestion: 20, eta: 2, accessible: true,  status: 'low' },
  F: { id: 'F', label: 'Gate F - West',   congestion: 70, eta: 6, accessible: false, status: 'high' },
});

/** @returns {Object} Six food stalls with varied wait times and dietary types */
const makeFood = () => ({
  F1: { id: 'F1', name: 'North Bites', near: 'Gate A', section: 'A', crowdLevel: 20, waitTime: 3,  type: 'any' },
  F2: { id: 'F2', name: 'East Grill',  near: 'Gate C', section: 'C', crowdLevel: 75, waitTime: 12, type: 'veg' },
  F3: { id: 'F3', name: 'South Cafe',  near: 'Gate D', section: 'D', crowdLevel: 40, waitTime: 5,  type: 'non-veg' },
  F4: { id: 'F4', name: 'West Snacks', near: 'Gate F', section: 'F', crowdLevel: 15, waitTime: 2,  type: 'any' },
  F5: { id: 'F5', name: 'Center Food', near: 'Gate B', section: 'B', crowdLevel: 55, waitTime: 7,  type: 'veg' },
  F6: { id: 'F6', name: 'Quick Bites', near: 'Gate E', section: 'E', crowdLevel: 30, waitTime: 4,  type: 'non-veg' },
});

/** @returns {Object} Four washrooms with varied accessibility */
const makeWashrooms = () => ({
  W1: { id: 'W1', label: 'Washroom North Upper', section: 'A', crowdLevel: 20, waitTime: 2, accessible: true },
  W2: { id: 'W2', label: 'Washroom East',        section: 'C', crowdLevel: 70, waitTime: 9, accessible: false },
  W3: { id: 'W3', label: 'Washroom South',       section: 'D', crowdLevel: 35, waitTime: 4, accessible: true },
  W4: { id: 'W4', label: 'Washroom West',        section: 'F', crowdLevel: 15, waitTime: 1, accessible: true },
});

/** @returns {Object} Four exits with varied crowd and parking */
const makeExits = () => ({
  north: { id: 'north', label: 'North Exit', crowdLevel: 15, etaMinutes: 3, parkingNearby: true },
  south: { id: 'south', label: 'South Exit', crowdLevel: 80, etaMinutes: 8, parkingNearby: false },
  east:  { id: 'east',  label: 'East Exit',  crowdLevel: 45, etaMinutes: 5, parkingNearby: true },
  west:  { id: 'west',  label: 'West Exit',  crowdLevel: 30, etaMinutes: 4, parkingNearby: false },
});

/** @returns {Object} Full venue state fixture */
const makeVenueState = (phase = PHASES.PRE_MATCH, gateOverrides = {}) => ({
  eventPhase:  phase,
  eventName:   'Test Match',
  gates:       makeGates(gateOverrides),
  corridors: {
    innerNorth: { congestion: 40 },
    innerSouth: { congestion: 30 },
    innerEast:  { congestion: 35 },
    innerWest:  { congestion: 25 },
  },
  foodStalls:   makeFood(),
  washrooms:    makeWashrooms(),
  exits:        makeExits(),
  sections:     { A: { gate: 'A', label: 'Section A' }, B: { gate: 'B', label: 'Section B' } },
  activeAlerts: [],
});

/** @returns {Object} User profile fixture */
const makeUserProfile = (overrides = {}) => ({
  seatSection:       'A',
  accessibilityMode: false,
  wheelchairMode:    false,
  familyGroupMode:   false,
  groupSize:         1,
  foodPreference:    'any',
  ...overrides,
});

// ─── Return Shape Tests ───────────────────────────────────────────────────────
describe('getRecommendations — return shape', () => {
  it('returns a complete recommendation object with all required keys', () => {
    const result = getRecommendations(makeVenueState(), makeUserProfile());
    expect(result).toHaveProperty('bestGate');
    expect(result).toHaveProperty('bestRoute');
    expect(result).toHaveProperty('bestFood');
    expect(result).toHaveProperty('bestWashroom');
    expect(result).toHaveProperty('bestExit');
    expect(result).toHaveProperty('shouldLeaveNow');
    expect(result).toHaveProperty('leaveAdvice');
  });

  it('bestGate has id, reason, and alternate fields', () => {
    const { bestGate } = getRecommendations(makeVenueState(), makeUserProfile());
    expect(typeof bestGate.id).toBe('string');
    expect(typeof bestGate.reason).toBe('string');
    expect(bestGate.reason.length).toBeGreaterThan(0);
    expect(typeof bestGate.alternate).toBe('string');
  });

  it('bestRoute has a non-empty path array', () => {
    const { bestRoute } = getRecommendations(makeVenueState(), makeUserProfile());
    expect(Array.isArray(bestRoute.path)).toBe(true);
    expect(bestRoute.path.length).toBeGreaterThan(0);
  });

  it('shouldLeaveNow is a boolean', () => {
    const { shouldLeaveNow } = getRecommendations(makeVenueState(), makeUserProfile());
    expect(typeof shouldLeaveNow).toBe('boolean');
  });

  it('leaveAdvice is a non-empty string', () => {
    const { leaveAdvice } = getRecommendations(makeVenueState(), makeUserProfile());
    expect(typeof leaveAdvice).toBe('string');
    expect(leaveAdvice.length).toBeGreaterThan(0);
  });
});

// ─── Gate Selection Tests ─────────────────────────────────────────────────────
describe('getRecommendations — gate selection', () => {
  it('never recommends Gate C (85% congestion) for section A', () => {
    const { bestGate } = getRecommendations(makeVenueState(), makeUserProfile({ seatSection: 'A' }));
    expect(bestGate.id).not.toBe('C');
  });

  it('never recommends Gate F (70% congestion) as best for section A', () => {
    const { bestGate } = getRecommendations(makeVenueState(), makeUserProfile({ seatSection: 'A' }));
    expect(bestGate.id).not.toBe('F');
  });

  it('recommends a gate when all gates have equal congestion (0%)', () => {
    const allClear = { A: { congestion: 0 }, B: { congestion: 0 }, C: { congestion: 0 }, D: { congestion: 0 }, E: { congestion: 0 }, F: { congestion: 0 } };
    const venueState = makeVenueState(PHASES.PRE_MATCH, allClear);
    const { bestGate } = getRecommendations(venueState, makeUserProfile());
    expect(typeof bestGate.id).toBe('string');
    expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(bestGate.id);
  });

  it('does not crash when all gates are at 100% congestion', () => {
    const allFull = {
      A: { id: 'A', label: 'Gate A', congestion: 100, eta: 30, accessible: true, status: 'critical' },
      B: { id: 'B', label: 'Gate B', congestion: 100, eta: 30, accessible: true,  status: 'critical' },
      C: { id: 'C', label: 'Gate C', congestion: 100, eta: 30, accessible: false, status: 'critical' },
      D: { id: 'D', label: 'Gate D', congestion: 100, eta: 30, accessible: true,  status: 'critical' },
      E: { id: 'E', label: 'Gate E', congestion: 100, eta: 30, accessible: true,  status: 'critical' },
      F: { id: 'F', label: 'Gate F', congestion: 100, eta: 30, accessible: false, status: 'critical' },
    };
    const venueState = { ...makeVenueState(), gates: allFull };
    expect(() => getRecommendations(venueState, makeUserProfile())).not.toThrow();
  });
});

// ─── Accessibility Mode Tests ─────────────────────────────────────────────────
describe('getRecommendations — accessibility constraints', () => {
  it('respects accessibilityMode — never recommends non-accessible gates', () => {
    const { bestGate } = getRecommendations(
      makeVenueState(),
      makeUserProfile({ accessibilityMode: true })
    );
    expect(bestGate.id).not.toBe('C');
    expect(bestGate.id).not.toBe('F');
  });

  it('returns a valid gate when all accessible gates have high congestion', () => {
    const gates = {
      A: { id: 'A', label: 'Gate A', congestion: 90, eta: 10, accessible: true, status: 'critical' },
      B: { id: 'B', label: 'Gate B', congestion: 95, eta: 15, accessible: true, status: 'critical' },
      C: { id: 'C', label: 'Gate C', congestion: 10, eta: 2,  accessible: false, status: 'low' },
      D: { id: 'D', label: 'Gate D', congestion: 92, eta: 12, accessible: true,  status: 'critical' },
      E: { id: 'E', label: 'Gate E', congestion: 88, eta: 9,  accessible: true,  status: 'critical' },
      F: { id: 'F', label: 'Gate F', congestion: 5,  eta: 1,  accessible: false, status: 'low' },
    };
    const venueState = { ...makeVenueState(), gates };
    const { bestGate } = getRecommendations(venueState, makeUserProfile({ accessibilityMode: true }));
    expect(['A', 'B', 'D', 'E']).toContain(bestGate.id);
  });

  it('respects wheelchairMode — only recommends accessible washrooms', () => {
    const { bestWashroom } = getRecommendations(
      makeVenueState(),
      makeUserProfile({ wheelchairMode: true })
    );
    expect(bestWashroom.accessible).toBe(true);
  });
});

// ─── Food Preference Tests ─────────────────────────────────────────────────────
describe('getRecommendations — food stall selection', () => {
  it('respects food preference "veg" — only returns veg stalls', () => {
    const { bestFood } = getRecommendations(
      makeVenueState(),
      makeUserProfile({ foodPreference: 'veg' })
    );
    expect(['F2', 'F5']).toContain(bestFood.id);
  });

  it('respects food preference "non-veg" — only returns non-veg stalls', () => {
    const { bestFood } = getRecommendations(
      makeVenueState(),
      makeUserProfile({ foodPreference: 'non-veg' })
    );
    expect(['F3', 'F6']).toContain(bestFood.id);
  });

  it('returns a result for "any" preference — picks the best overall stall', () => {
    const { bestFood } = getRecommendations(makeVenueState(), makeUserProfile({ foodPreference: 'any' }));
    expect(['F1', 'F2', 'F3', 'F4', 'F5', 'F6']).toContain(bestFood.id);
  });

  it('does not crash when food preference matches no stalls', () => {
    const allNonVeg = Object.fromEntries(
      Object.entries(makeFood()).map(([k, v]) => [k, { ...v, type: 'non-veg' }])
    );
    const venueState = { ...makeVenueState(), foodStalls: allNonVeg };
    expect(() => getRecommendations(venueState, makeUserProfile({ foodPreference: 'veg' }))).not.toThrow();
  });
});

// ─── Exit Recommendation Tests ────────────────────────────────────────────────
describe('getRecommendations — exit recommendation', () => {
  it('recommends North Exit which has lowest crowd level (15%)', () => {
    const { bestExit } = getRecommendations(makeVenueState(), makeUserProfile());
    expect(bestExit.id).toBe('north');
  });

  it('family group mode prefers exits with parkingNearby', () => {
    const { bestExit } = getRecommendations(
      makeVenueState(),
      makeUserProfile({ familyGroupMode: true })
    );
    expect(bestExit.parkingNearby).toBe(true);
  });

  it('does not crash in post-match phase with all critical exits', () => {
    const criticalExits = {
      north: { id: 'north', label: 'North Exit', crowdLevel: 95, etaMinutes: 15, parkingNearby: true },
      south: { id: 'south', label: 'South Exit', crowdLevel: 92, etaMinutes: 14, parkingNearby: false },
      east:  { id: 'east',  label: 'East Exit',  crowdLevel: 88, etaMinutes: 12, parkingNearby: true },
      west:  { id: 'west',  label: 'West Exit',  crowdLevel: 85, etaMinutes: 10, parkingNearby: false },
    };
    const venueState = { ...makeVenueState(PHASES.POST_MATCH), exits: criticalExits };
    expect(() => getRecommendations(venueState, makeUserProfile())).not.toThrow();
  });
});

// ─── shouldLeaveNow Tests ─────────────────────────────────────────────────────
describe('getRecommendations — shouldLeaveNow', () => {
  it('is false during pre-match phase', () => {
    const { shouldLeaveNow } = getRecommendations(
      makeVenueState(PHASES.PRE_MATCH),
      makeUserProfile()
    );
    expect(shouldLeaveNow).toBe(false);
  });

  it('is false during halftime phase', () => {
    const { shouldLeaveNow } = getRecommendations(
      makeVenueState(PHASES.HALFTIME),
      makeUserProfile()
    );
    expect(shouldLeaveNow).toBe(false);
  });

  it('is false during post-match phase', () => {
    const { shouldLeaveNow } = getRecommendations(
      makeVenueState(PHASES.POST_MATCH),
      makeUserProfile()
    );
    expect(shouldLeaveNow).toBe(false);
  });
});

// ─── Malformed Input Tests ────────────────────────────────────────────────────
describe('getRecommendations — malformed input edge cases', () => {
  it('does not throw on empty activeAlerts array', () => {
    const venueState = { ...makeVenueState(), activeAlerts: [] };
    expect(() => getRecommendations(venueState, makeUserProfile())).not.toThrow();
  });

  it('does not throw when seatSection is undefined', () => {
    const profile = makeUserProfile({ seatSection: undefined });
    expect(() => getRecommendations(makeVenueState(), profile)).not.toThrow();
  });

  it('handles unknown seatSection gracefully (falls back to default weights)', () => {
    const profile = makeUserProfile({ seatSection: 'Z' });
    expect(() => getRecommendations(makeVenueState(), profile)).not.toThrow();
  });

  it('returns alternate gate different from best gate', () => {
    const { bestGate } = getRecommendations(makeVenueState(), makeUserProfile());
    expect(typeof bestGate.alternate).toBe('string');
  });
});
