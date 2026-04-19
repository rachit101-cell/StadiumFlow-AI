import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const VenueContext = createContext();

export const INITIAL_VENUE_STATE = {
  eventPhase: 'pre-match', // pre-match, live-match, halftime, post-match
  eventName: "Chennai Super Kings vs Mumbai Indians",
  eventTime: "19:30",
  venueName: "StadiumFlow Arena",
  
  gates: {
    A: { label: "Gate A - North", congestion: 65, status: "medium", eta: 12, accessible: true },
    B: { label: "Gate B - NE", congestion: 55, status: "medium", eta: 8, accessible: false },
    C: { label: "Gate C - East", congestion: 40, status: "low", eta: 4, accessible: true },
    D: { label: "Gate D - SE", congestion: 70, status: "high", eta: 15, accessible: true },
    E: { label: "Gate E - South", congestion: 50, status: "medium", eta: 7, accessible: false },
    F: { label: "Gate F - West", congestion: 45, status: "low", eta: 6, accessible: true }
  },
  
  corridors: {
    northRing: { congestion: 40, blocked: false },
    southRing: { congestion: 35, blocked: false },
    eastRing: { congestion: 30, blocked: false },
    westRing: { congestion: 45, blocked: false },
    innerNorth: { congestion: 40, blocked: false, stairs: false },
    innerSouth: { congestion: 35, blocked: false, stairs: true },
    innerEast: { congestion: 30, blocked: false, stairs: false },
    innerWest: { congestion: 45, blocked: false, stairs: true }
  },
  
  sections: {
    A: { label: "Section A", gate: "A", capacity: 80, level: "lower" },
    B: { label: "Section B", gate: "B", capacity: 75, level: "upper" },
    C: { label: "Section C", gate: "C", capacity: 90, level: "lower" },
    D: { label: "Section D", gate: "D", capacity: 60, level: "upper" },
    E: { label: "Section E", gate: "E", capacity: 85, level: "lower" },
    F: { label: "Section F", gate: "F", capacity: 70, level: "upper" },
    G: { label: "Section G", gate: "F", capacity: 95, level: "lower" },
    H: { label: "Section H", gate: "A", capacity: 65, level: "upper" }
  },
  
  foodStalls: {
    F1: { name: "North Bites", near: "Gate A", section: "A", waitTime: 5, crowdLevel: 20, type: ["veg","non-veg","drinks"], accessible: true },
    F2: { name: "NE Snacks", near: "Gate B", section: "B", waitTime: 8, crowdLevel: 30, type: ["snacks","drinks"], accessible: false },
    F3: { name: "East Grill", near: "Gate C", section: "C", waitTime: 4, crowdLevel: 25, type: ["non-veg","drinks"], accessible: true },
    F4: { name: "South Cafe", near: "Gate E", section: "E", waitTime: 12, crowdLevel: 35, type: ["veg","drinks"], accessible: true },
    F5: { name: "West Meals", near: "Gate F", section: "F", waitTime: 6, crowdLevel: 25, type: ["veg","non-veg","drinks"], accessible: true },
    F6: { name: "Prime Refreshments", near: "Gate D", section: "D", waitTime: 3, crowdLevel: 20, type: ["drinks","snacks"], accessible: true }
  },
  
  washrooms: {
    W1: { label: "Washroom North Upper", near: "Gate A", section: "A", waitTime: 2, crowdLevel: 15, accessible: true },
    W2: { label: "Washroom East", near: "Gate C", section: "C", waitTime: 4, crowdLevel: 25, accessible: true },
    W3: { label: "Washroom South", near: "Gate E", section: "E", waitTime: 5, crowdLevel: 20, accessible: true },
    W4: { label: "Washroom West", near: "Gate F", section: "F", waitTime: 1, crowdLevel: 10, accessible: false }
  },
  
  exits: {
    north: { label: "North Exit", crowdLevel: 5, etaMinutes: 2, parkingNearby: true, transportNearby: false },
    south: { label: "South Exit", crowdLevel: 5, etaMinutes: 2, parkingNearby: false, transportNearby: true },
    east: { label: "East Exit", crowdLevel: 5, etaMinutes: 3, parkingNearby: true, transportNearby: true },
    west: { label: "West Exit", crowdLevel: 5, etaMinutes: 2, parkingNearby: false, transportNearby: false }
  },
  
  activeAlerts: [], // { id, type, message, severity, timestamp, dismissible }
  organizerAdvisories: [], // { id, message, sentAt, targetZone }
  aiRecommendations: [], // { id, zone, action, urgency, reason, advisoryText, approved, dismissed }
  
  simulationActive: true,
  spikeZone: null // null | zoneName
};

function venueReducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, ...action.payload };
    case 'APPLY_NOISE': {
       // Deep copy of relevant entities to apply noise
       const newState = { ...state };
       
       const addNoise = (val, max = 100) => {
         const noise = Math.floor(Math.random() * 11) - 5; // -5 to +5
         return Math.min(max, Math.max(0, val + noise));
       };

       const updateStatus = (congestion) => {
           if (congestion >= 75) return 'critical';
           if (congestion >= 60) return 'high';
           if (congestion >= 40) return 'medium';
           return 'low';
       }

       newState.gates = Object.fromEntries(Object.entries(state.gates).map(([k, v]) => {
           const newCong = addNoise(v.congestion);
           return [k, { ...v, congestion: newCong, status: updateStatus(newCong) }];
       }));
       newState.corridors = Object.fromEntries(Object.entries(state.corridors).map(([k, v]) => [k, { ...v, congestion: addNoise(v.congestion) }]));
       newState.foodStalls = Object.fromEntries(Object.entries(state.foodStalls).map(([k, v]) => [k, { ...v, crowdLevel: addNoise(v.crowdLevel), waitTime: Math.max(1, addNoise(v.waitTime, 45)) }]));
       newState.washrooms = Object.fromEntries(Object.entries(state.washrooms).map(([k, v]) => [k, { ...v, crowdLevel: addNoise(v.crowdLevel), waitTime: Math.max(0, addNoise(v.waitTime, 30)) }]));
       newState.exits = Object.fromEntries(Object.entries(state.exits).map(([k, v]) => [k, { ...v, crowdLevel: addNoise(v.crowdLevel) }]));
       
       return newState;
    }
    case 'ADD_ALERT':
       // check if identical alert exists to prevent duplicates
       if (state.activeAlerts.find(a => a.id === action.payload.id)) return state;
       return { ...state, activeAlerts: [action.payload, ...state.activeAlerts] };
    case 'DISMISS_ALERT':
       return { ...state, activeAlerts: state.activeAlerts.filter(a => a.id !== action.payload) };
    case 'ADD_ADVISORY':
       return { ...state, organizerAdvisories: [action.payload, ...state.organizerAdvisories] };
    case 'ADD_AI_RECOMMENDATION':
       return { ...state, aiRecommendations: [action.payload, ...state.aiRecommendations] };
    case 'UPDATE_AI_RECOMMENDATION':
        return { 
          ...state, 
          aiRecommendations: state.aiRecommendations.map(r => r.id === action.payload.id ? { ...r, ...action.payload.updates } : r)
        };
    case 'TRIGGER_SPIKE': {
       const { updates, spikeZone } = action.payload;
       return { ...state, ...updates, spikeZone };
    }
    case 'DAMPEN_SPIKE': {
        const { updates } = action.payload;
        return { ...state, ...updates, spikeZone: null };
    }
    default:
      return state;
  }
}

/**
 * VenueProvider — provides live venue state and dispatch to the component tree.
 * Context value is memoized to prevent unnecessary re-renders in consumers.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const VenueProvider = ({ children }) => {
  const [venueState, dispatch] = useReducer(venueReducer, INITIAL_VENUE_STATE);

  const dispatchAction = useCallback((action) => {
    dispatch(action);
  }, []);

  const contextValue = useMemo(
    () => ({ venueState, dispatch: dispatchAction }),
    [venueState, dispatchAction]
  );

  return (
    <VenueContext.Provider value={contextValue}>
      {children}
    </VenueContext.Provider>
  );
};

VenueProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useVenue = () => useContext(VenueContext);
