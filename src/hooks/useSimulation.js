import { useEffect, useRef, useCallback } from 'react';
import { useVenue, INITIAL_VENUE_STATE } from '../contexts/VenueContext';
import { PHASES, ALERT_THRESHOLDS, SIMULATION, CONGESTION } from '../constants/venue';

// ─── Pure Functions (exported for testability) ────────────────────────────────

/**
 * Derives the congestion status label from a numeric congestion value.
 * @param {number} congestion - Congestion percentage (0-100)
 * @returns {'critical'|'high'|'medium'|'low'} Status label
 */
export function getCongestionStatus(congestion) {
  if (congestion >= 75) return 'critical';
  if (congestion >= 60) return 'high';
  if (congestion >= 40) return 'medium';
  return 'low';
}

/**
 * Applies a random noise offset to a numeric value, clamped to [0, max].
 * @param {number} val - Current value
 * @param {number} [max=100] - Maximum allowed value
 * @returns {number} Value with noise applied
 */
export function addNoise(val, max = 100) {
  const noise = Math.floor(Math.random() * 11) - 5; // -5 to +5
  return Math.min(max, Math.max(0, val + noise));
}

/**
 * Returns a full venue state snapshot for a given event phase preset.
 * Applies the canonical baseline values from PHASE_PRESETS and random corridor/facility values.
 *
 * @param {string} phase - One of PHASES.PRE_MATCH | LIVE_MATCH | HALFTIME | POST_MATCH
 * @returns {Object} Full venue state with phase preset applied
 */
export function applyPhasePreset(phase) {
  const s = JSON.parse(JSON.stringify(INITIAL_VENUE_STATE));
  s.eventPhase = phase;

  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const setGateCongestions = (overrides) => {
    Object.keys(overrides).forEach(k => {
      if (s.gates[k]) {
        s.gates[k].congestion = overrides[k];
        s.gates[k].status = getCongestionStatus(overrides[k]);
      }
    });
  };

  const randCongestion = (entities, min, max) => {
    Object.keys(s[entities]).forEach(k => {
      s[entities][k].congestion = r(min, max);
      s[entities][k].status = getCongestionStatus(s[entities][k].congestion);
    });
  };

  const randFacilities = (entities, min, max) => {
    Object.keys(s[entities]).forEach(k => {
      s[entities][k].crowdLevel = r(min, max);
      s[entities][k].waitTime   = r(Math.max(1, Math.floor(min / 10)), Math.floor(max / 7));
    });
  };

  const randExits = (min, max) => {
    Object.keys(s.exits).forEach(k => {
      s.exits[k].crowdLevel  = r(min, max);
      s.exits[k].etaMinutes  = r(2, 6);
    });
  };

  if (phase === PHASES.PRE_MATCH) {
    setGateCongestions({ A: 65, B: 55, C: 40, D: 70, E: 50, F: 45 });
    randCongestion('corridors', 30, 45);
    randFacilities('foodStalls', 20, 35);
    randFacilities('washrooms', 15, 25);
    randExits(5, 5);
    s.gates.D.status = 'high';
  } else if (phase === PHASES.LIVE_MATCH) {
    setGateCongestions({ A: 20, B: 25, C: 15, D: 20, E: 18, F: 22 });
    randCongestion('corridors', 15, 30);
    randFacilities('foodStalls', 35, 55);
    randFacilities('washrooms', 30, 45);
    randExits(5, 5);
  } else if (phase === PHASES.HALFTIME) {
    randCongestion('gates', 15, 20);
    randCongestion('corridors', 40, 55);
    s.corridors.innerNorth.congestion = 82;
    s.corridors.innerEast.congestion  = 75;
    s.foodStalls.F1.crowdLevel = 88; s.foodStalls.F2.crowdLevel = 79; s.foodStalls.F3.crowdLevel = 83;
    s.foodStalls.F4.crowdLevel = 40; s.foodStalls.F5.crowdLevel = 35; s.foodStalls.F6.crowdLevel = 30;
    s.washrooms.W1.crowdLevel  = 85; s.washrooms.W2.crowdLevel  = 78;
    s.washrooms.W3.crowdLevel  = 35; s.washrooms.W4.crowdLevel  = 30;
    randExits(5, 5);
  } else if (phase === PHASES.POST_MATCH) {
    randCongestion('gates', 10, 15);
    randCongestion('corridors', 55, 75);
    randFacilities('foodStalls', 20, 30);
    randFacilities('washrooms', 20, 30);
    s.exits.north.crowdLevel = 88; s.exits.south.crowdLevel = 82;
    s.exits.east.crowdLevel  = 70; s.exits.west.crowdLevel  = 55;
  }

  return s;
}

/**
 * Applies random ±5 noise to all congestion/crowd/wait values in the venue state.
 * Returns a new state object — does not mutate input.
 *
 * @param {Object} state - Current venue state
 * @returns {Object} New venue state with noise applied to all entities
 */
export function applyCongestionNoise(state) {
  const newState = { ...state };

  newState.gates = Object.fromEntries(
    Object.entries(state.gates).map(([k, v]) => {
      const newCong = addNoise(v.congestion);
      return [k, { ...v, congestion: newCong, status: getCongestionStatus(newCong) }];
    })
  );
  newState.corridors = Object.fromEntries(
    Object.entries(state.corridors).map(([k, v]) => [k, { ...v, congestion: addNoise(v.congestion) }])
  );
  newState.foodStalls = Object.fromEntries(
    Object.entries(state.foodStalls).map(([k, v]) => [k, { ...v, crowdLevel: addNoise(v.crowdLevel), waitTime: Math.max(1, addNoise(v.waitTime, 45)) }])
  );
  newState.washrooms = Object.fromEntries(
    Object.entries(state.washrooms).map(([k, v]) => [k, { ...v, crowdLevel: addNoise(v.crowdLevel), waitTime: Math.max(0, addNoise(v.waitTime, 30)) }])
  );
  newState.exits = Object.fromEntries(
    Object.entries(state.exits).map(([k, v]) => [k, { ...v, crowdLevel: addNoise(v.crowdLevel) }])
  );

  return newState;
}

/**
 * Generates a spiked venue state with a specific zone set to critical congestion.
 * Returns a new state object — does not mutate input.
 *
 * @param {Object} state - Current venue state
 * @param {'gate'|'corridor'} entityType - The type of entity to spike
 * @param {string} entityId - The specific entity key to spike (e.g. 'A', 'innerNorth')
 * @returns {Object} New venue state with spike applied
 */
export function generateSpikeState(state, entityType, entityId) {
  const s = JSON.parse(JSON.stringify(state));
  if (entityType === 'gate' && s.gates[entityId]) {
    s.gates[entityId].congestion = 95;
    s.gates[entityId].status = 'critical';
  }
  if (entityType === 'corridor' && s.corridors[entityId]) {
    s.corridors[entityId].congestion = 90;
  }
  return s;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSimulation — manages the live venue simulation loop.
 * Provides setPhase, triggerSpike, and triggerHalftimeRushCascade controls.
 *
 * @returns {{ setPhase: Function, triggerSpike: Function, triggerHalftimeRushCascade: Function }}
 */
export const useSimulation = () => {
  const { venueState, dispatch } = useVenue();
  const prevAlertStates  = useRef(new Set());
  const spikeTimeoutRef  = useRef(null);
  const noiseIntervalRef = useRef(null); // Always store interval in ref, not state

  // ── Noise interval — pauses when tab is hidden ──────────────────────────
  useEffect(() => {
    if (!venueState.simulationActive) return;

    const startNoise = () => {
      noiseIntervalRef.current = setInterval(() => {
        // React 18 automatic batching handles multiple dispatches efficiently
        dispatch({ type: 'APPLY_NOISE' });
      }, SIMULATION.NOISE_INTERVAL_MS);
    };

    const stopNoise = () => clearInterval(noiseIntervalRef.current);

    startNoise();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopNoise();
      } else {
        startNoise();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopNoise();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [venueState.simulationActive, dispatch]);

  // ── Alert threshold monitor ─────────────────────────────────────────────
  useEffect(() => {
    const check = (id, type, val, threshold, contextName) => {
      if (val >= threshold) {
        const alertId = `${type}-${id}`;
        if (!prevAlertStates.current.has(alertId)) {
          prevAlertStates.current.add(alertId);
          dispatch({
            type: 'ADD_ALERT',
            payload: {
              id: `${alertId}-${Date.now()}`,
              type,
              message: `${contextName}: High congestion detected. Avoid this area if possible.`,
              severity: val >= threshold + 10 ? 'critical' : 'high',
              timestamp: Date.now(),
              dismissible: true,
            },
          });
        }
      } else {
        prevAlertStates.current.delete(`${type}-${id}`);
      }
    };

    Object.entries(venueState.gates).forEach(([k, v]) => check(k, 'gate', v.congestion, ALERT_THRESHOLDS.GATES, v.label));
    Object.entries(venueState.corridors).forEach(([k, v]) => check(k, 'route', v.congestion, ALERT_THRESHOLDS.CORRIDORS, `Corridor ${k}`));
    Object.entries(venueState.foodStalls).forEach(([k, v]) => check(k, 'facility', v.crowdLevel, ALERT_THRESHOLDS.FOOD_STALLS, v.name));
    Object.entries(venueState.washrooms).forEach(([k, v]) => check(k, 'facility', v.crowdLevel, ALERT_THRESHOLDS.WASHROOMS, v.label));
    Object.entries(venueState.exits).forEach(([k, v]) => check(k, 'exit', v.crowdLevel, ALERT_THRESHOLDS.EXITS, v.label));
  }, [venueState, dispatch]);

  // ── Phase setter ────────────────────────────────────────────────────────
  const setPhase = useCallback((phaseName) => {
    const s = applyPhasePreset(phaseName);

    if (phaseName === PHASES.HALFTIME) {
      dispatch({
        type: 'ADD_AI_RECOMMENDATION',
        payload: {
          id: 'ai-rec-halftime',
          zone: 'North Inner Corridor',
          action: 'Deploy staff to redirect crowd',
          urgency: 'critical',
          reason: 'Simultaneous food and washroom rush detected',
          advisoryText: 'High congestion near North Bites. Please use East Grill or South Cafe if possible.',
          approved: false,
          dismissed: false,
        },
      });
    }

    dispatch({ type: 'SET_PHASE', payload: s });
  }, [dispatch]);

  // ── Spike trigger ───────────────────────────────────────────────────────
  const triggerSpike = useCallback((zoneName, entityType) => {
    const spiked = generateSpikeState(venueState, entityType === 'gate' ? 'gate' : 'corridor', zoneName);
    dispatch({ type: 'TRIGGER_SPIKE', payload: { updates: spiked, spikeZone: zoneName } });

    if (spikeTimeoutRef.current) clearTimeout(spikeTimeoutRef.current);
    spikeTimeoutRef.current = setTimeout(() => {
      const dampened = JSON.parse(JSON.stringify(spiked));
      if (entityType === 'gate' && dampened.gates[zoneName]) dampened.gates[zoneName].congestion = 65;
      if (entityType === 'corridor' && dampened.corridors[zoneName]) dampened.corridors[zoneName].congestion = 60;
      dispatch({ type: 'DAMPEN_SPIKE', payload: { updates: dampened } });
    }, SIMULATION.SPIKE_DAMPEN_MS);
  }, [venueState, dispatch]);

  const triggerHalftimeRushCascade = useCallback(() => {
    setPhase(PHASES.HALFTIME);
  }, [setPhase]);

  return { setPhase, triggerSpike, triggerHalftimeRushCascade };
};
