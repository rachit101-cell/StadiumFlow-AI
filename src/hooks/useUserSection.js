import { useMemo } from 'react';
import { useVenue } from '../contexts/VenueContext';
import { useUser } from '../contexts/UserContext';

/**
 * useUserSection — returns data about the user's current seat section,
 * including the nearest gate and nearest facilities.
 *
 * @returns {{
 *   sectionData: Object|null,
 *   nearestGate: string,
 *   nearestFoodStall: Object|null,
 *   nearestWashroom: Object|null,
 *   sectionLabel: string,
 * }}
 */
export function useUserSection() {
  const { venueState } = useVenue();
  const { userProfile } = useUser();
  const { seatSection } = userProfile;

  const sectionData = useMemo(
    () => venueState.sections[seatSection] || null,
    [venueState.sections, seatSection]
  );

  const nearestGate = useMemo(
    () => sectionData?.gate || 'A',
    [sectionData]
  );

  const nearestFoodStall = useMemo(() => {
    const sectionStalls = Object.entries(venueState.foodStalls)
      .filter(([, f]) => f.section === seatSection)
      .sort((a, b) => a[1].waitTime - b[1].waitTime);
    return sectionStalls[0]?.[1] || null;
  }, [venueState.foodStalls, seatSection]);

  const nearestWashroom = useMemo(() => {
    const sectionWashrooms = Object.entries(venueState.washrooms)
      .filter(([, w]) => w.section === seatSection)
      .sort((a, b) => a[1].waitTime - b[1].waitTime);
    return sectionWashrooms[0]?.[1] || null;
  }, [venueState.washrooms, seatSection]);

  const sectionLabel = sectionData?.label || `Section ${seatSection}`;

  return { sectionData, nearestGate, nearestFoodStall, nearestWashroom, sectionLabel };
}
