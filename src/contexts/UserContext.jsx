import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const UserContext = createContext();

/**
 * Default user profile — all fields nullable/optional except role and onboardingComplete.
 */
const initialProfile = {
  role:              'attendee', // 'attendee' | 'organizer'
  name:              '',
  seatSection:       'A',        // 'A' through 'H'
  ticketNumber:      '',
  accessibilityMode: false,
  wheelchairMode:    false,
  familyGroupMode:   false,
  groupSize:         2,
  foodPreference:    'any',      // 'veg' | 'non-veg' | 'any'
  language:          'en',
  onboardingComplete: false,
};

/**
 * UserProvider — provides user profile state and setter functions to the component tree.
 * Context value is memoized to prevent unnecessary re-renders in consumers.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(initialProfile);

  /**
   * Merges partial updates into the user profile.
   * @param {Partial<typeof initialProfile>} updates
   */
  const updateProfile = useCallback((updates) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Switches the user to organizer role and marks onboarding complete.
   */
  const loginAsOrganizer = useCallback(() => {
    setUserProfile((prev) => ({ ...prev, role: 'organizer', onboardingComplete: true }));
  }, []);

  /**
   * Switches the user to attendee role (resets onboarding flag for flow restart).
   */
  const loginAsAttendee = useCallback(() => {
    setUserProfile((prev) => ({ ...prev, role: 'attendee' }));
  }, []);

  /**
   * Resets the profile to the initial state.
   */
  const resetProfile = useCallback(() => {
    setUserProfile(initialProfile);
  }, []);

  const contextValue = useMemo(
    () => ({ userProfile, updateProfile, loginAsOrganizer, loginAsAttendee, resetProfile }),
    [userProfile, updateProfile, loginAsOrganizer, loginAsAttendee, resetProfile]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * useUser — returns the UserContext value.
 * @returns {{ userProfile: Object, updateProfile: Function, loginAsOrganizer: Function, loginAsAttendee: Function, resetProfile: Function }}
 */
export const useUser = () => useContext(UserContext);
