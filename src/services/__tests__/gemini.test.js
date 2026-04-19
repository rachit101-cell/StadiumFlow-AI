import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeGeminiOutput, buildAttendeeContext, buildOrganizerContext, getCachedResponse } from '../../services/gemini';
import { PHASES } from '../../constants/venue';

const makeVenueState = (phase = PHASES.PRE_MATCH) => ({
  eventPhase:   phase,
  eventName:    'Test Cup Final',
  gates: {
    A: { id: 'A', congestion: 30, label: 'Gate A', eta: 3, accessible: true  },
    B: { id: 'B', congestion: 60, label: 'Gate B', eta: 5, accessible: true  },
    C: { id: 'C', congestion: 85, label: 'Gate C', eta: 8, accessible: false },
    D: { id: 'D', congestion: 45, label: 'Gate D', eta: 4, accessible: true  },
    E: { id: 'E', congestion: 20, label: 'Gate E', eta: 2, accessible: true  },
    F: { id: 'F', congestion: 70, label: 'Gate F', eta: 6, accessible: false },
  },
  corridors: {
    innerNorth: { congestion: 40 }, innerSouth: { congestion: 30 },
    innerEast:  { congestion: 35 }, innerWest:  { congestion: 25 },
  },
  foodStalls: {
    F1: { name: 'North Bites', near: 'Gate A', section: 'A', waitTime: 3, crowdLevel: 20, type: 'any' },
    F2: { name: 'East Grill',  near: 'Gate C', section: 'C', waitTime: 12, crowdLevel: 75, type: 'veg' },
    F3: { name: 'South Cafe',  near: 'Gate D', section: 'D', waitTime: 5,  crowdLevel: 40, type: 'non-veg' },
    F4: { name: 'West Snacks', near: 'Gate F', section: 'F', waitTime: 2,  crowdLevel: 15, type: 'any' },
    F5: { name: 'Center Food', near: 'Gate B', section: 'B', waitTime: 7,  crowdLevel: 55, type: 'veg' },
    F6: { name: 'Quick Bites', near: 'Gate E', section: 'E', waitTime: 4,  crowdLevel: 30, type: 'non-veg' },
  },
  washrooms: {
    W1: { label: 'Washroom W1', section: 'A', waitTime: 2, crowdLevel: 20, accessible: true },
    W2: { label: 'Washroom W2', section: 'C', waitTime: 9, crowdLevel: 70, accessible: false },
    W3: { label: 'Washroom W3', section: 'D', waitTime: 4, crowdLevel: 35, accessible: true },
    W4: { label: 'Washroom W4', section: 'F', waitTime: 1, crowdLevel: 15, accessible: true },
  },
  exits: {
    north: { label: 'North Exit', crowdLevel: 15, etaMinutes: 3, parkingNearby: true },
    south: { label: 'South Exit', crowdLevel: 80, etaMinutes: 8, parkingNearby: false },
    east:  { label: 'East Exit',  crowdLevel: 45, etaMinutes: 5, parkingNearby: true },
    west:  { label: 'West Exit',  crowdLevel: 30, etaMinutes: 4, parkingNearby: false },
  },
  sections:     { A: { gate: 'A', label: 'Section A' } },
  activeAlerts: [{ message: 'Gate D is at high congestion' }],
});

const makeUserProfile = (overrides = {}) => ({
  seatSection: 'A', accessibilityMode: false, wheelchairMode: false,
  familyGroupMode: false, groupSize: 1, foodPreference: 'any', name: 'Test User',
  ...overrides,
});

// ─── sanitizeGeminiOutput ─────────────────────────────────────────────────────
describe('sanitizeGeminiOutput', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeGeminiOutput(null)).toBe('');
    expect(sanitizeGeminiOutput(undefined)).toBe('');
    expect(sanitizeGeminiOutput(123)).toBe('');
  });

  it('returns the input string unchanged when DOMPurify is not available in SSR', () => {
    // jsdom + mock DOMPurify (passthrough) — output should match input
    const input = 'Hello from Gemini — this is <b>bold</b>';
    expect(sanitizeGeminiOutput(input)).toBe(input);
  });
});

// ─── buildAttendeeContext ─────────────────────────────────────────────────────
describe('buildAttendeeContext', () => {
  it('includes the event name', () => {
    const ctx = buildAttendeeContext(makeVenueState(), makeUserProfile());
    expect(ctx).toContain('Test Cup Final');
  });

  it('includes the event phase', () => {
    const ctx = buildAttendeeContext(makeVenueState(PHASES.LIVE_MATCH), makeUserProfile());
    expect(ctx).toContain(PHASES.LIVE_MATCH);
  });

  it('includes the user seat section', () => {
    const ctx = buildAttendeeContext(makeVenueState(), makeUserProfile({ seatSection: 'A' }));
    expect(ctx).toContain('A');
  });

  it('mentions accessibility mode when enabled', () => {
    const ctx = buildAttendeeContext(makeVenueState(), makeUserProfile({ accessibilityMode: true }));
    expect(ctx).toContain('Enabled');
  });

  it('returns a non-empty string', () => {
    const ctx = buildAttendeeContext(makeVenueState(), makeUserProfile());
    expect(typeof ctx).toBe('string');
    expect(ctx.length).toBeGreaterThan(50);
  });
});

// ─── buildOrganizerContext ────────────────────────────────────────────────────
describe('buildOrganizerContext', () => {
  it('includes gate congestion data', () => {
    const ctx = buildOrganizerContext(makeVenueState());
    expect(ctx).toContain('Gate A');
  });

  it('includes food stall data', () => {
    const ctx = buildOrganizerContext(makeVenueState());
    expect(ctx).toContain('North Bites');
  });

  it('includes the highest risk zone', () => {
    const ctx = buildOrganizerContext(makeVenueState());
    expect(ctx).toContain('Gate C'); // 85% — highest
  });

  it('returns a non-empty string', () => {
    const ctx = buildOrganizerContext(makeVenueState());
    expect(typeof ctx).toBe('string');
    expect(ctx.length).toBeGreaterThan(50);
  });
});

// ─── getCachedResponse ────────────────────────────────────────────────────────
describe('getCachedResponse', () => {
  it('returns null for an uncached key', () => {
    expect(getCachedResponse('nonexistent-key-xyz')).toBeNull();
  });
});
