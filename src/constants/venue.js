/**
 * @fileoverview Central constants for StadiumFlow AI venue simulation.
 * All magic strings and numbers in the codebase must reference these exports.
 * Every object is frozen to prevent accidental mutation at runtime.
 */

/** Match event phases */
export const PHASES = Object.freeze({
  PRE_MATCH:  'pre-match',
  LIVE_MATCH: 'live-match',
  HALFTIME:   'halftime',
  POST_MATCH: 'post-match',
});

/** Congestion level thresholds (percent) */
export const CONGESTION = Object.freeze({
  SAFE_MAX:    40,
  MEDIUM_MAX:  65,
  HIGH_MAX:    80,
  CRITICAL_MIN: 81,
});

/** Congestion status labels */
export const CONGESTION_STATUS = Object.freeze({
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical',
});

/** Gate identifiers */
export const GATES = Object.freeze({
  A: 'A', B: 'B', C: 'C',
  D: 'D', E: 'E', F: 'F',
});

/** Food stall identifiers */
export const STALLS = Object.freeze({
  F1: 'F1', F2: 'F2', F3: 'F3',
  F4: 'F4', F5: 'F5', F6: 'F6',
});

/** Washroom identifiers */
export const WASHROOMS = Object.freeze({
  W1: 'W1', W2: 'W2', W3: 'W3', W4: 'W4',
});

/** Exit identifiers */
export const EXITS = Object.freeze({
  NORTH: 'north', SOUTH: 'south',
  EAST:  'east',  WEST:  'west',
});

/** Alert type identifiers */
export const ALERT_TYPES = Object.freeze({
  GATE:      'gate',
  ROUTE:     'route',
  FACILITY:  'facility',
  EXIT:      'exit',
  EMERGENCY: 'emergency',
  ORGANIZER: 'organizer',
});

/** Alert severity levels */
export const SEVERITIES = Object.freeze({
  INFO:     'info',
  WARNING:  'warning',
  HIGH:     'high',
  CRITICAL: 'critical',
});

/** User roles */
export const ROLES = Object.freeze({
  ATTENDEE:  'attendee',
  ORGANIZER: 'organizer',
});

/** Seat sections */
export const SECTIONS = Object.freeze({
  A: 'A', B: 'B', C: 'C', D: 'D',
  E: 'E', F: 'F', G: 'G', H: 'H',
});

/** Food preference options */
export const FOOD_PREFERENCES = Object.freeze({
  VEG:     'veg',
  NON_VEG: 'non-veg',
  ANY:     'any',
});

/** Simulation timing constants (milliseconds) */
export const SIMULATION = Object.freeze({
  NOISE_INTERVAL_MS:    10000,
  SPIKE_DAMPEN_MS:      90000,
  SPIKE_DAMPEN_STEPS:   6,
  CACHE_TTL_MS:         45000,
  CACHE_MAX_SIZE:       50,
  SKELETON_DURATION_MS: 1200,
  TRAVELER_DELAY_MS:    1200,
  METRICS_REFRESH_MS:   10000,
  RATE_LIMIT_MAX_CALLS: 10,
  RATE_LIMIT_WINDOW_MS: 60000,
});

/** Recommendation scoring weights */
export const WEIGHTS = Object.freeze({
  GATE_CONGESTION:     1.0,
  GATE_PROXIMITY:      0.8,
  FOOD_WAIT:           3.0,
  FOOD_DISTANCE:       5.0,
  WASHROOM_WAIT:       4.0,
  WASHROOM_DISTANCE:   4.0,
  EXIT_CROWD:          1.0,
  EXIT_ETA:            6.0,
  FAMILY_PARKING_BONUS: 15,
});

/** Gemini model configuration */
export const GEMINI = Object.freeze({
  MODEL:            'gemini-1.5-flash',
  MAX_OUTPUT_TOKENS: 256,
  TEMPERATURE:      0.4,
  TOP_K:            32,
  TOP_P:            0.85,
  MAX_INPUT_LENGTH: 500,
});

/** Alert threshold triggers — entity type keys match venueState structure */
export const ALERT_THRESHOLDS = Object.freeze({
  GATE:       70,
  GATES:      70,   // alias — used by useSimulation
  CORRIDOR:   65,
  CORRIDORS:  65,   // alias — used by useSimulation
  FOOD_STALL: 75,
  FOOD_STALLS: 75,  // alias — used by useSimulation
  WASHROOM:   70,
  WASHROOMS:  70,   // alias — used by useSimulation
  EXIT:       80,
  EXITS:      80,   // alias — used by useSimulation
});

/** Exact phase baseline congestion presets */
export const PHASE_PRESETS = Object.freeze({
  [PHASES.PRE_MATCH]: Object.freeze({
    gates: Object.freeze({
      [GATES.A]: 65, [GATES.B]: 55, [GATES.C]: 40,
      [GATES.D]: 70, [GATES.E]: 50, [GATES.F]: 45,
    }),
    corridors: Object.freeze({
      'north-ring': 35, 'south-ring': 30, 'east-ring': 32,
      'west-ring': 28, 'inner-north': 20, 'inner-south': 18,
      'inner-east': 22, 'inner-west': 19,
    }),
    foodStalls: Object.freeze({
      [STALLS.F1]: 25, [STALLS.F2]: 20, [STALLS.F3]: 30,
      [STALLS.F4]: 15, [STALLS.F5]: 18, [STALLS.F6]: 22,
    }),
    washrooms: Object.freeze({
      [WASHROOMS.W1]: 20, [WASHROOMS.W2]: 15,
      [WASHROOMS.W3]: 18, [WASHROOMS.W4]: 12,
    }),
    exits: Object.freeze({
      [EXITS.NORTH]: 5, [EXITS.SOUTH]: 5,
      [EXITS.EAST]: 5,  [EXITS.WEST]: 5,
    }),
  }),
  [PHASES.LIVE_MATCH]: Object.freeze({
    gates: Object.freeze({
      [GATES.A]: 20, [GATES.B]: 25, [GATES.C]: 15,
      [GATES.D]: 20, [GATES.E]: 18, [GATES.F]: 22,
    }),
    corridors: Object.freeze({
      'north-ring': 22, 'south-ring': 18, 'east-ring': 20,
      'west-ring': 17, 'inner-north': 28, 'inner-south': 24,
      'inner-east': 26, 'inner-west': 22,
    }),
    foodStalls: Object.freeze({
      [STALLS.F1]: 40, [STALLS.F2]: 35, [STALLS.F3]: 45,
      [STALLS.F4]: 30, [STALLS.F5]: 28, [STALLS.F6]: 32,
    }),
    washrooms: Object.freeze({
      [WASHROOMS.W1]: 35, [WASHROOMS.W2]: 30,
      [WASHROOMS.W3]: 28, [WASHROOMS.W4]: 25,
    }),
    exits: Object.freeze({
      [EXITS.NORTH]: 5, [EXITS.SOUTH]: 5,
      [EXITS.EAST]: 5,  [EXITS.WEST]: 5,
    }),
  }),
  [PHASES.HALFTIME]: Object.freeze({
    gates: Object.freeze({
      [GATES.A]: 15, [GATES.B]: 18, [GATES.C]: 12,
      [GATES.D]: 16, [GATES.E]: 14, [GATES.F]: 17,
    }),
    corridors: Object.freeze({
      'north-ring': 55, 'south-ring': 48, 'east-ring': 50,
      'west-ring': 45, 'inner-north': 82, 'inner-south': 70,
      'inner-east': 75, 'inner-west': 68,
    }),
    foodStalls: Object.freeze({
      [STALLS.F1]: 88, [STALLS.F2]: 79, [STALLS.F3]: 83,
      [STALLS.F4]: 40, [STALLS.F5]: 35, [STALLS.F6]: 30,
    }),
    washrooms: Object.freeze({
      [WASHROOMS.W1]: 85, [WASHROOMS.W2]: 78,
      [WASHROOMS.W3]: 35, [WASHROOMS.W4]: 30,
    }),
    exits: Object.freeze({
      [EXITS.NORTH]: 5, [EXITS.SOUTH]: 5,
      [EXITS.EAST]: 5,  [EXITS.WEST]: 5,
    }),
  }),
  [PHASES.POST_MATCH]: Object.freeze({
    gates: Object.freeze({
      [GATES.A]: 12, [GATES.B]: 14, [GATES.C]: 10,
      [GATES.D]: 13, [GATES.E]: 11, [GATES.F]: 15,
    }),
    corridors: Object.freeze({
      'north-ring': 70, 'south-ring': 65, 'east-ring': 60,
      'west-ring': 55, 'inner-north': 75, 'inner-south': 68,
      'inner-east': 63, 'inner-west': 58,
    }),
    foodStalls: Object.freeze({
      [STALLS.F1]: 25, [STALLS.F2]: 22, [STALLS.F3]: 28,
      [STALLS.F4]: 18, [STALLS.F5]: 20, [STALLS.F6]: 24,
    }),
    washrooms: Object.freeze({
      [WASHROOMS.W1]: 22, [WASHROOMS.W2]: 20,
      [WASHROOMS.W3]: 18, [WASHROOMS.W4]: 16,
    }),
    exits: Object.freeze({
      [EXITS.NORTH]: 88, [EXITS.SOUTH]: 82,
      [EXITS.EAST]:  70, [EXITS.WEST]:  55,
    }),
  }),
});
