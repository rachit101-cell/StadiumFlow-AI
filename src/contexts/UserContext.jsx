import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const UserContext = createContext();

const initialProfile = {
  role: 'attendee', // attendee | organizer
  name: '',
  seatSection: 'A', // A through H
  ticketNumber: '',
  accessibilityMode: false,
  wheelchairMode: false,
  familyGroupMode: false,
  groupSize: 2,
  foodPreference: 'any', // veg | non-veg | any
  language: 'en',
  onboardingComplete: false,
};

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(initialProfile);

  const updateProfile = (updates) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  const loginAsOrganizer = () => {
    setUserProfile((prev) => ({ ...prev, role: 'organizer', onboardingComplete: true }));
  };

  const loginAsAttendee = () => {
    setUserProfile((prev) => ({ ...prev, role: 'attendee' })); // Reset to step 1
  };
  
  const resetProfile = () => {
    setUserProfile(initialProfile);
  }

  return (
    <UserContext.Provider value={{ userProfile, updateProfile, loginAsOrganizer, loginAsAttendee, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUser = () => useContext(UserContext);
