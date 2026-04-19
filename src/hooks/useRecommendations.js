import { useMemo } from 'react';
import { useVenue } from '../contexts/VenueContext';
import { useUser } from '../contexts/UserContext';
import { getRecommendations } from '../utils/recommendationEngine';

/**
 * useRecommendations — memoized wrapper around the recommendation engine.
 * Recalculates only when venueState or userProfile changes.
 *
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
export function useRecommendations() {
  const { venueState } = useVenue();
  const { userProfile } = useUser();

  const recommendations = useMemo(
    () => getRecommendations(venueState, userProfile),
    [venueState, userProfile]
  );

  return recommendations;
}
