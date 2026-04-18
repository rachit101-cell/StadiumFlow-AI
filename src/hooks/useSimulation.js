import { useEffect, useRef, useCallback } from 'react';
import { useVenue, INITIAL_VENUE_STATE } from '../contexts/VenueContext';

// Helper to generate a baseline preset
const createPhaseState = (base, overrides) => {
  const phaseState = JSON.parse(JSON.stringify(base));
  Object.assign(phaseState, overrides);
  return phaseState;
};

export const useSimulation = () => {
  const { venueState, dispatch } = useVenue();
  const alertThresholds = { gates: 70, corridors: 65, food: 75, washrooms: 70, exits: 80 };
  const prevAlertStates = useRef(new Set()); // to avoid spamming alerts
  const spikeTimeoutRef = useRef(null);

  // Apply noise every 10 seconds
  useEffect(() => {
    if (!venueState.simulationActive) return;
    const interval = setInterval(() => {
      dispatch({ type: 'APPLY_NOISE' });
    }, 10000);
    return () => clearInterval(interval);
  }, [venueState.simulationActive, dispatch]);

  // Monitor thresholds and trigger alerts
  useEffect(() => {
    const checkAndDispatchAlert = (id, type, val, threshold, contextName) => {
      if (val >= threshold) {
        const alertId = `${type}-${id}`;
        if (!prevAlertStates.current.has(alertId)) {
           prevAlertStates.current.add(alertId);
           dispatch({
             type: 'ADD_ALERT',
             payload: {
               id: alertId + '-' + Date.now(),
               type,
               message: `${contextName}: High congestion detected. Avoid this area if possible.`,
               severity: val >= threshold + 10 ? 'critical' : 'high',
               timestamp: Date.now(),
               dismissible: true
             }
           });
        }
      } else {
         const alertId = `${type}-${id}`;
         prevAlertStates.current.delete(alertId); // allow re-trigger if it drops and rises again
      }
    };

    Object.entries(venueState.gates).forEach(([k, v]) => checkAndDispatchAlert(k, 'gate', v.congestion, alertThresholds.gates, v.label));
    Object.entries(venueState.corridors).forEach(([k, v]) => checkAndDispatchAlert(k, 'route', v.congestion, alertThresholds.corridors, `Corridor ${k}`));
    Object.entries(venueState.foodStalls).forEach(([k, v]) => checkAndDispatchAlert(k, 'facility', v.crowdLevel, alertThresholds.food, v.name));
    Object.entries(venueState.washrooms).forEach(([k, v]) => checkAndDispatchAlert(k, 'facility', v.crowdLevel, alertThresholds.washrooms, v.label));
    Object.entries(venueState.exits).forEach(([k, v]) => checkAndDispatchAlert(k, 'exit', v.crowdLevel, alertThresholds.exits, v.label));
    
  }, [venueState, dispatch, alertThresholds.corridors, alertThresholds.exits, alertThresholds.food, alertThresholds.gates, alertThresholds.washrooms]);

  const setPhase = useCallback((phaseName) => {
    const s = JSON.parse(JSON.stringify(INITIAL_VENUE_STATE));
    s.eventPhase = phaseName;
    
    // Default randomization helpers for un-specified fields
    const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const updEntitiesCongestion = (entities, min, max) => {
      Object.keys(s[entities]).forEach(k => { s[entities][k].congestion = r(min, max); s[entities][k].status = s[entities][k].congestion > 70 ? 'high' : 'medium'; });
    };
    const updFacilities = (entities, min, max) => {
      Object.keys(s[entities]).forEach(k => { s[entities][k].crowdLevel = r(min, max); s[entities][k].waitTime = r(Math.max(1, Math.floor(min/10)), Math.floor(max/7)); });
    };
    const updExits = (min, max) => {
       Object.keys(s.exits).forEach(k => { s.exits[k].crowdLevel = r(min, max); s.exits[k].etaMinutes = r(2, 6); });
    }

    if (phaseName === 'pre-match') {
      s.gates.A.congestion = 65; s.gates.B.congestion = 55; s.gates.C.congestion = 40; 
      s.gates.D.congestion = 70; s.gates.E.congestion = 50; s.gates.F.congestion = 45;
      updEntitiesCongestion('corridors', 30, 45);
      updFacilities('foodStalls', 20, 35);
      updFacilities('washrooms', 15, 25);
      updExits(5, 5);
      s.gates.D.status = 'high';
    } 
    else if (phaseName === 'live-match') {
      s.gates.A.congestion = 20; s.gates.B.congestion = 25; s.gates.C.congestion = 15; 
      s.gates.D.congestion = 20; s.gates.E.congestion = 18; s.gates.F.congestion = 22;
      updEntitiesCongestion('corridors', 15, 30);
      updFacilities('foodStalls', 35, 55);
      updFacilities('washrooms', 30, 45);
      updExits(5, 5);
    }
    else if (phaseName === 'halftime') {
       updEntitiesCongestion('gates', 15, 20);
       updEntitiesCongestion('corridors', 40, 55);
       s.corridors.innerNorth.congestion = 82;
       s.corridors.innerEast.congestion = 75;
       s.foodStalls.F1.crowdLevel = 88; s.foodStalls.F2.crowdLevel = 79; s.foodStalls.F3.crowdLevel = 83;
       s.foodStalls.F4.crowdLevel = 40; s.foodStalls.F5.crowdLevel = 35; s.foodStalls.F6.crowdLevel = 30;
       s.washrooms.W1.crowdLevel = 85; s.washrooms.W2.crowdLevel = 78; s.washrooms.W3.crowdLevel = 35; s.washrooms.W4.crowdLevel = 30;
       updExits(5, 5);
       // Also push AI recommendation for organizer
       dispatch({ type: 'ADD_AI_RECOMMENDATION', payload: {
         id: 'ai-rec-halftime', zone: 'North Inner Corridor', action: 'Deploy staff to redirect crowd',
         urgency: 'critical', reason: 'Simultaneous food and washroom rush detected',
         advisoryText: 'High congestion near North Bites. Please use East Grill or South Cafe if possible.',
         approved: false, dismissed: false
       }});
    }
    else if (phaseName === 'post-match') {
       updEntitiesCongestion('gates', 10, 15);
       updEntitiesCongestion('corridors', 55, 75);
       updFacilities('foodStalls', 20, 30);
       updFacilities('washrooms', 20, 30);
       s.exits.north.crowdLevel = 88; s.exits.south.crowdLevel = 82;
       s.exits.east.crowdLevel = 70;  s.exits.west.crowdLevel = 55;
    }

    dispatch({ type: 'SET_PHASE', payload: s });
  }, [dispatch]);

  const triggerSpike = useCallback((zoneName, entityType, config) => {
    // Generate isolated updates based on type
    const s = JSON.parse(JSON.stringify(venueState));
    if (entityType === 'gate' && s.gates[zoneName]) s.gates[zoneName].congestion = 95;
    if (entityType === 'corridor' && s.corridors[zoneName]) s.corridors[zoneName].congestion = 90;

    dispatch({ type: 'TRIGGER_SPIKE', payload: { updates: s, spikeZone: zoneName } });

    if (spikeTimeoutRef.current) clearTimeout(spikeTimeoutRef.current);
    // dampening
    spikeTimeoutRef.current = setTimeout(() => {
        const dampened = JSON.parse(JSON.stringify(s));
        if (entityType === 'gate' && dampened.gates[zoneName]) dampened.gates[zoneName].congestion = 65;
        if (entityType === 'corridor' && dampened.corridors[zoneName]) dampened.corridors[zoneName].congestion = 60;
        dispatch({ type: 'DAMPEN_SPIKE', payload: { updates: dampened } });
    }, 90000);

  }, [venueState, dispatch]);

  const triggerHalftimeRushCascade = useCallback(() => {
    setPhase('halftime');
  }, [setPhase]);

  return { setPhase, triggerSpike, triggerHalftimeRushCascade };
};
