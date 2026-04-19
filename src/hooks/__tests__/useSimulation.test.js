import { describe, it, expect } from 'vitest';
import {
  addNoise,
  getCongestionStatus,
  applyPhasePreset,
  applyCongestionNoise,
  generateSpikeState,
} from '../../hooks/useSimulation';
import { PHASES } from '../../constants/venue';

// ─── addNoise ─────────────────────────────────────────────────────────────────
describe('addNoise', () => {
  it('clamps output to [0, max]', () => {
    for (let i = 0; i < 50; i++) {
      const result = addNoise(50);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    }
  });

  it('does not exceed custom max', () => {
    for (let i = 0; i < 20; i++) {
      expect(addNoise(45, 45)).toBeLessThanOrEqual(45);
    }
  });

  it('does not go below 0 at minimum input', () => {
    for (let i = 0; i < 20; i++) {
      expect(addNoise(0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('stays within ±5 of input value', () => {
    const base = 50;
    for (let i = 0; i < 30; i++) {
      const result = addNoise(base);
      expect(result).toBeGreaterThanOrEqual(base - 5);
      expect(result).toBeLessThanOrEqual(base + 5);
    }
  });
});

// ─── getCongestionStatus ──────────────────────────────────────────────────────
describe('getCongestionStatus', () => {
  it('returns "critical" at 75+', () => { expect(getCongestionStatus(75)).toBe('critical'); });
  it('returns "critical" at 100',  () => { expect(getCongestionStatus(100)).toBe('critical'); });
  it('returns "high" at 60-74',    () => { expect(getCongestionStatus(60)).toBe('high'); });
  it('returns "high" at 74',       () => { expect(getCongestionStatus(74)).toBe('high'); });
  it('returns "medium" at 40-59',  () => { expect(getCongestionStatus(55)).toBe('medium'); });
  it('returns "low" at 0',         () => { expect(getCongestionStatus(0)).toBe('low'); });
  it('returns "low" at 39',        () => { expect(getCongestionStatus(39)).toBe('low'); });
});

// ─── applyPhasePreset ─────────────────────────────────────────────────────────
describe('applyPhasePreset', () => {
  it('sets eventPhase to PRE_MATCH', () => {
    const s = applyPhasePreset(PHASES.PRE_MATCH);
    expect(s.eventPhase).toBe(PHASES.PRE_MATCH);
  });

  it('sets eventPhase to LIVE_MATCH', () => {
    const s = applyPhasePreset(PHASES.LIVE_MATCH);
    expect(s.eventPhase).toBe(PHASES.LIVE_MATCH);
  });

  it('returns an object with gates, corridors, foodStalls, washrooms, exits', () => {
    const s = applyPhasePreset(PHASES.HALFTIME);
    expect(s).toHaveProperty('gates');
    expect(s).toHaveProperty('corridors');
    expect(s).toHaveProperty('foodStalls');
    expect(s).toHaveProperty('washrooms');
    expect(s).toHaveProperty('exits');
  });

  it('HALFTIME sets high congestion on F1 food stall (≥70)', () => {
    const s = applyPhasePreset(PHASES.HALFTIME);
    expect(s.foodStalls.F1.crowdLevel).toBeGreaterThanOrEqual(70);
  });

  it('POST_MATCH sets high exit congestion (north ≥ 70)', () => {
    const s = applyPhasePreset(PHASES.POST_MATCH);
    expect(s.exits.north.crowdLevel).toBeGreaterThanOrEqual(70);
  });

  it('all gate congestions are in [0, 100]', () => {
    const s = applyPhasePreset(PHASES.PRE_MATCH);
    Object.values(s.gates).forEach(g => {
      expect(g.congestion).toBeGreaterThanOrEqual(0);
      expect(g.congestion).toBeLessThanOrEqual(100);
    });
  });
});

// ─── applyCongestionNoise ─────────────────────────────────────────────────────
describe('applyCongestionNoise', () => {
  const baseState = applyPhasePreset(PHASES.LIVE_MATCH);

  it('does not mutate the input state', () => {
    const copy  = JSON.parse(JSON.stringify(baseState));
    applyCongestionNoise(baseState);
    expect(baseState).toEqual(copy);
  });

  it('returns all gate congestion values in [0, 100]', () => {
    const s = applyCongestionNoise(baseState);
    Object.values(s.gates).forEach(g => {
      expect(g.congestion).toBeGreaterThanOrEqual(0);
      expect(g.congestion).toBeLessThanOrEqual(100);
    });
  });

  it('returns all food stall waitTime values ≥ 1', () => {
    const s = applyCongestionNoise(baseState);
    Object.values(s.foodStalls).forEach(f => {
      expect(f.waitTime).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── generateSpikeState ───────────────────────────────────────────────────────
describe('generateSpikeState', () => {
  const baseState = applyPhasePreset(PHASES.LIVE_MATCH);

  it('sets target gate congestion to 95', () => {
    const s = generateSpikeState(baseState, 'gate', 'A');
    expect(s.gates.A.congestion).toBe(95);
  });

  it('sets target gate status to critical', () => {
    const s = generateSpikeState(baseState, 'gate', 'B');
    expect(s.gates.B.status).toBe('critical');
  });

  it('sets corridor congestion to 90', () => {
    const s = generateSpikeState(baseState, 'corridor', 'innerNorth');
    expect(s.corridors.innerNorth.congestion).toBe(90);
  });

  it('does not mutate the input state', () => {
    const copy = JSON.parse(JSON.stringify(baseState));
    generateSpikeState(baseState, 'gate', 'A');
    expect(baseState).toEqual(copy);
  });

  it('does not affect other gates', () => {
    const s = generateSpikeState(baseState, 'gate', 'A');
    expect(s.gates.B.congestion).toBe(baseState.gates.B.congestion);
  });
});
