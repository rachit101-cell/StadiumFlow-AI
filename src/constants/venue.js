/**
 * @fileoverview Central constants file for StadiumFlow AI.
 * All hardcoded strings, numeric thresholds, and configuration values
 * are defined here and imported throughout the codebase.
 */

// ─── Event Phases ─────────────────────────────────────────────────────────────
export const PHASES = {
  PRE_MATCH:  'pre-match',
  LIVE_MATCH: 'live-match',
  HALFTIME:   'halftime',
  POST_MATCH: 'post-match',
};

// ─── Congestion Thresholds ────────────────────────────────────────────────────
export const CONGESTION = {
  SAFE_MAX:   40,
  MEDIUM_MAX: 65,
  HIGH_MAX:   80,
  CRITICAL_MIN: 81,
};

// ─── Gate IDs ─────────────────────────────────────────────────────────────────
export const GATES = {
  A: 'A', B: 'B', C: 'C',
  D: 'D', E: 'E', F: 'F',
};

// ─── Food Stall IDs ───────────────────────────────────────────────────────────
export const STALLS = {
  F1: 'F1', F2: 'F2', F3: 'F3',
  F4: 'F4', F5: 'F5', F6: 'F6',
};

// ─── Washroom IDs ─────────────────────────────────────────────────────────────
export const WASHROOMS = {
  W1: 'W1', W2: 'W2',
  W3: 'W3', W4: 'W4',
};

// ─── Alert Types ──────────────────────────────────────────────────────────────
export const ALERT_TYPES = {
  GATE:       'gate',
  ROUTE:      'route',
  FACILITY:   'facility',
  EXIT:       'exit',
  EMERGENCY:  'emergency',
  ORGANIZER:  'organizer',
};

// ─── Alert Severities ─────────────────────────────────────────────────────────
export const SEVERITIES = {
  INFO:     'info',
  WARNING:  'warning',
  HIGH:     'high',
  CRITICAL: 'critical',
};

// ─── Simulation Timing ────────────────────────────────────────────────────────
export const SIMULATION = {
  NOISE_INTERVAL_MS:   10000,
  SPIKE_DAMPEN_MS:     90000,
  CACHE_TTL_MS:        45000,
  CACHE_MAX_SIZE:      50,
  SKELETON_DURATION_MS: 1200,
  METRICS_REFRESH_MS:  10000,
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  ATTENDEE:  'attendee',
  ORGANIZER: 'organizer',
};

// ─── Alert Thresholds (by entity type) ───────────────────────────────────────
export const ALERT_THRESHOLDS = {
  GATES:      70,
  CORRIDORS:  65,
  FOOD_STALLS: 75,
  WASHROOMS:  70,
  EXITS:      80,
};

// ─── Phase Presets — exact baseline values ────────────────────────────────────
export const PHASE_PRESETS = {
  [PHASES.PRE_MATCH]: {
    gates:     { A: 65, B: 55, C: 40, D: 70, E: 50, F: 45 },
    foodStalls: { F1: 25, F2: 20, F3: 30, F4: 15, F5: 18, F6: 22 },
    washrooms: { W1: 20, W2: 15, W3: 18, W4: 12 },
    exits:     { north: 5, south: 5, east: 5, west: 5 },
  },
  [PHASES.LIVE_MATCH]: {
    gates:     { A: 20, B: 25, C: 15, D: 20, E: 18, F: 22 },
    foodStalls: { F1: 40, F2: 35, F3: 45, F4: 30, F5: 28, F6: 32 },
    washrooms: { W1: 35, W2: 30, W3: 28, W4: 25 },
    exits:     { north: 5, south: 5, east: 5, west: 5 },
  },
  [PHASES.HALFTIME]: {
    gates:     { A: 15, B: 18, C: 12, D: 16, E: 14, F: 17 },
    foodStalls: { F1: 88, F2: 79, F3: 83, F4: 40, F5: 35, F6: 30 },
    washrooms: { W1: 85, W2: 78, W3: 35, W4: 30 },
    exits:     { north: 5, south: 5, east: 5, west: 5 },
  },
  [PHASES.POST_MATCH]: {
    gates:     { A: 12, B: 14, C: 10, D: 13, E: 11, F: 15 },
    foodStalls: { F1: 25, F2: 22, F3: 28, F4: 18, F5: 20, F6: 24 },
    washrooms: { W1: 22, W2: 20, W3: 18, W4: 16 },
    exits:     { north: 88, south: 82, east: 70, west: 55 },
  },
};
