import { useMemo, useCallback } from 'react';
import { useVenue } from '../contexts/VenueContext';
import { PHASES } from '../constants/venue';

/** Human-readable labels for each event phase. */
const PHASE_LABELS = {
  [PHASES.PRE_MATCH]:  'Pre-Match',
  [PHASES.LIVE_MATCH]: 'Live Match',
  [PHASES.HALFTIME]:   'Half-Time',
  [PHASES.POST_MATCH]: 'Post-Match',
};

/** Material Symbol icon names for each event phase. */
const PHASE_ICONS = {
  [PHASES.PRE_MATCH]:  'schedule',
  [PHASES.LIVE_MATCH]: 'sports_soccer',
  [PHASES.HALFTIME]:   'sports',
  [PHASES.POST_MATCH]: 'emoji_events',
};

/**
 * useEventPhase — provides current event phase metadata and a phase comparison helper.
 *
 * @returns {{
 *   phase: string,
 *   phaseLabel: string,
 *   phaseIcon: string,
 *   isPhase: (phase: string) => boolean,
 *   PHASES: Object,
 * }}
 */
export function useEventPhase() {
  const { venueState } = useVenue();
  const phase = venueState.eventPhase;

  const phaseLabel = useMemo(() => PHASE_LABELS[phase] || phase, [phase]);
  const phaseIcon  = useMemo(() => PHASE_ICONS[phase]  || 'circle',     [phase]);

  /**
   * Returns true if the current phase matches the given phase constant.
   * @param {string} targetPhase - Phase constant from PHASES
   * @returns {boolean}
   */
  const isPhase = useCallback((targetPhase) => phase === targetPhase, [phase]);

  return { phase, phaseLabel, phaseIcon, isPhase, PHASES };
}
