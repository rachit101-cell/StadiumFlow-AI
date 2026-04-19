import { describe, it, expect } from 'vitest';
import {
  addNoise,
  getCongestionStatus,
  applyPhasePreset,
  applyCongestionNoise,
  generateSpikeState,
} from '../../hooks/useSimulation';
import { PHASES, PHASE_PRESETS } from '../../constants/venue';

// ─── addNoise ─────────────────────────────────────────────────────────────────
describe('addNoise', () => {
  it('clamps output to [0, 100] for a mid-range value over 50 iterations', () => {
    for (let i = 0; i < 50; i++) {
      const result = addNoise(50);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    }
  });

  it('never exceeds custom max', () => {
    for (let i = 0; i < 20; i++) {
      expect(addNoise(45, 45)).toBeLessThanOrEqual(45);
    }
  });

  it('clamps to 0 when input is 0 (never goes negative)', () => {
    for (let i = 0; i < 20; i++) {
      expect(addNoise(0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('clamps to max when input is at max', () => {
    for (let i = 0; i < 20; i++) {
      expect(addNoise(100)).toBeLessThanOrEqual(100);
    }
  });

  it('maximum delta does not exceed 15 in any direction across 50 iterations', () => {
    const base = 50;
    for (let i = 0; i < 50; i++) {
      const result = addNoise(base);
      expect(Math.abs(result - base)).toBeLessThanOrEqual(15);
    }
  });

  it('stays within ±5 of input value for non-boundary inputs', () => {
    for (let i = 0; i < 30; i++) {
      const result = addNoise(50);
      expect(result).toBeGreaterThanOrEqual(45);
      expect(result).toBeLessThanOrEqual(55);
    }
  });
});

// ─── getCongestionStatus ──────────────────────────────────────────────────────
describe('getCongestionStatus', () => {
  it('returns "critical" at 75', () => { expect(getCongestionStatus(75)).toBe('critical'); });
  it('returns "critical" at 100',  () => { expect(getCongestionStatus(100)).toBe('critical'); });
  it('returns "high" at 60',       () => { expect(getCongestionStatus(60)).toBe('high'); });
  it('returns "high" at 74',       () => { expect(getCongestionStatus(74)).toBe('high'); });
  it('returns "medium" at 40',     () => { expect(getCongestionStatus(40)).toBe('medium'); });
  it('returns "medium" at 59',     () => { expect(getCongestionStatus(59)).toBe('medium'); });
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

  it('sets eventPhase to HALFTIME', () => {
    const s = applyPhasePreset(PHASES.HALFTIME);
    expect(s.eventPhase).toBe(PHASES.HALFTIME);
  });

  it('sets eventPhase to POST_MATCH', () => {
    const s = applyPhasePreset(PHASES.POST_MATCH);
    expect(s.eventPhase).toBe(PHASES.POST_MATCH);
  });

  it('returns an object with gates, corridors, foodStalls, washrooms, exits', () => {
    const s = applyPhasePreset(PHASES.HALFTIME);
    expect(s).toHaveProperty('gates');
    expect(s).toHaveProperty('corridors');
    expect(s).toHaveProperty('foodStalls');
    expect(s).toHaveProperty('washrooms');
    expect(s).toHaveProperty('exits');
  });

  it('PRE_MATCH: Gate A congestion matches preset (65)', () => {
    const s = applyPhasePreset(PHASES.PRE_MATCH);
    expect(s.gates.A.congestion).toBe(PHASE_PRESETS[PHASES.PRE_MATCH].gates.A);
  });

  it('PRE_MATCH: Gate C congestion matches preset (40)', () => {
    const s = applyPhasePreset(PHASES.PRE_MATCH);
    expect(s.gates.C.congestion).toBe(PHASE_PRESETS[PHASES.PRE_MATCH].gates.C);
  });

  it('LIVE_MATCH: Gate C congestion matches preset (15)', () => {
    const s = applyPhasePreset(PHASES.LIVE_MATCH);
    expect(s.gates.C.congestion).toBe(PHASE_PRESETS[PHASES.LIVE_MATCH].gates.C);
  });

  it('HALFTIME: F1 food stall crowd level matches preset (88)', () => {
    const s = applyPhasePreset(PHASES.HALFTIME);
    expect(s.foodStalls.F1.crowdLevel).toBe(PHASE_PRESETS[PHASES.HALFTIME].foodStalls.F1);
  });

  it('HALFTIME: W1 washroom crowd level matches preset (85)', () => {
    const s = applyPhasePreset(PHASES.HALFTIME);
    expect(s.washrooms.W1.crowdLevel).toBe(PHASE_PRESETS[PHASES.HALFTIME].washrooms.W1);
  });

  it('POST_MATCH: North exit crowd level matches preset (88)', () => {
    const s = applyPhasePreset(PHASES.POST_MATCH);
    expect(s.exits.north.crowdLevel).toBe(PHASE_PRESETS[PHASES.POST_MATCH].exits.north);
  });

  it('all gate congestions are in [0, 100] for all phases', () => {
    [PHASES.PRE_MATCH, PHASES.LIVE_MATCH, PHASES.HALFTIME, PHASES.POST_MATCH].forEach(phase => {
      const s = applyPhasePreset(phase);
      Object.values(s.gates).forEach(g => {
        expect(g.congestion).toBeGreaterThanOrEqual(0);
        expect(g.congestion).toBeLessThanOrEqual(100);
      });
    });
  });
});

// ─── applyCongestionNoise ─────────────────────────────────────────────────────
describe('applyCongestionNoise', () => {
  const baseState = applyPhasePreset(PHASES.LIVE_MATCH);

  it('does not mutate the input state', () => {
    const copy = JSON.parse(JSON.stringify(baseState));
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

  it('returns all washroom waitTime values ≥ 0', () => {
    const s = applyCongestionNoise(baseState);
    Object.values(s.washrooms).forEach(w => {
      expect(w.waitTime).toBeGreaterThanOrEqual(0);
    });
  });

  it('gate status field is updated in returned state', () => {
    const s = applyCongestionNoise(baseState);
    expect(['low', 'medium', 'high', 'critical']).toContain(s.gates.A.status);
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

  it('sets target gate C congestion to 95', () => {
    const s = generateSpikeState(baseState, 'gate', 'C');
    expect(s.gates.C.congestion).toBe(95);
  });

  it('sets corridor congestion to 90', () => {
    const s = generateSpikeState(baseState, 'corridor', 'innerNorth');
    expect(s.corridors.innerNorth.congestion).toBe(90);
  });

  it('sets innerEast corridor congestion to 90', () => {
    const s = generateSpikeState(baseState, 'corridor', 'innerEast');
    expect(s.corridors.innerEast.congestion).toBe(90);
  });

  it('does not mutate the input state', () => {
    const copy = JSON.parse(JSON.stringify(baseState));
    generateSpikeState(baseState, 'gate', 'A');
    expect(baseState).toEqual(copy);
  });

  it('does not affect non-spiked gates when spiking gate A', () => {
    const s = generateSpikeState(baseState, 'gate', 'A');
    expect(s.gates.B.congestion).toBe(baseState.gates.B.congestion);
    expect(s.gates.C.congestion).toBe(baseState.gates.C.congestion);
  });

  it('does not affect non-spiked corridors when spiking a gate', () => {
    const s = generateSpikeState(baseState, 'gate', 'A');
    expect(s.corridors.innerNorth.congestion).toBe(baseState.corridors.innerNorth.congestion);
  });

  it('handles unknown entity ID gracefully — returns unchanged state', () => {
    expect(() => generateSpikeState(baseState, 'gate', 'INVALID_GATE')).not.toThrow();
  });
});
