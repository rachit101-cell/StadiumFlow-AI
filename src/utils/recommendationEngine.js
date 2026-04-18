export const getRecommendations = (venueState, userProfile) => {
  const { eventPhase, gates, corridors, foodStalls, washrooms, exits, sections } = venueState;
  const { seatSection, accessibilityMode, wheelchairMode, familyGroupMode, foodPreference } = userProfile;

  // Statically define proximities mapping [Section] -> [Gate] proximity (1 is nearby, 0.2 is far) 
  // Gate array: [A, B, C, D, E, F]
  const proximities = {
    A: { A: 1, B: 0.8, C: 0.5, D: 0.2, E: 0.3, F: 0.8 },
    B: { A: 0.8, B: 1, C: 0.8, D: 0.4, E: 0.2, F: 0.5 },
    C: { A: 0.5, B: 0.8, C: 1, D: 0.8, E: 0.4, F: 0.2 },
    D: { A: 0.2, B: 0.4, C: 0.8, D: 1, E: 0.8, F: 0.3 },
    E: { A: 0.3, B: 0.2, C: 0.4, D: 0.8, E: 1, F: 0.8 },
    F: { A: 0.8, B: 0.5, C: 0.2, D: 0.3, E: 0.8, F: 1 },
    G: { A: 0.7, B: 0.4, C: 0.2, D: 0.4, E: 0.9, F: 1 },
    H: { A: 1, B: 0.7, C: 0.4, D: 0.2, E: 0.4, F: 0.8 }
  };
  
  // Section to section distance pseudo-matrix (0 = closest, 10 = furthest)
  const dist = (sec1, sec2) => {
      if (!sec1 || !sec2) return 5;
      const ring = ['A','B','C','D','E','F','G','H'];
      let idx1 = ring.indexOf(sec1);
      let idx2 = ring.indexOf(sec2);
      if (idx1 < 0 || idx2 < 0) return 5;
      let diff = Math.abs(idx1 - idx2);
      return Math.min(diff, ring.length - diff) * 2; 
  };

  const getExplanation = (type, rec, alt) => {
    if (type === 'gate') {
        if (accessibilityMode) return `Accessible route — stair-free path via Gate ${rec.id}`;
        return `Recommended for your section (${seatSection}) — Gate ${rec.id} is faster than Gate ${alt.id}`;
    }
    if (type === 'food') {
        if (foodPreference === 'veg') return `Vegetarian stalls only — filtered for your food preference`;
        if (familyGroupMode) return `Family route — avoids high-traffic corridors`;
        return `Recommended for your section (${seatSection}) — Wait time is only ${rec.waitTime} min`;
    }
    if (type === 'washroom') {
        if (wheelchairMode) return `Accessible route — stair-free path selected`;
        return `Recommended for your section (${seatSection}) — Closest with low queue`;
    }
    if (type === 'exit') {
        if (familyGroupMode && rec.parkingNearby) return `Family route — Chosen for easier group movement and parking proximity`;
        return `Recommended for your section (${seatSection}) — Shortest exit queue`;
    }
    return '';
  };

  // 1. BEST GATE
  let gateScores = Object.entries(gates).map(([id, g]) => {
     if (accessibilityMode && !g.accessible) return { id, score: -1, ...g };
     let p = proximities[seatSection]?.[id] || 0.5;
     return { id, score: (100 - g.congestion) * p, ...g };
  }).sort((a,b) => b.score - a.score);
  
  const bestGate = gateScores[0];
  const altGate = gateScores[1] || gateScores[0];
  const gateExpl = getExplanation('gate', bestGate, altGate);

  // 2. BEST ROUTE (Pseudo pathing based on gate)
  let bestRoute = { path: [bestGate.id, `${bestGate.id}-Inner-Ring`, `Section ${seatSection}`], etaMinutes: bestGate.eta + 4, reason: gateExpl, accessibleVariant: accessibilityMode };

  // 3. BEST FOOD
  let foodScores = Object.entries(foodStalls).map(([id, f]) => {
      if (foodPreference !== 'any' && !f.type.includes(foodPreference)) return { id, score: -1, ...f };
      let distance = dist(seatSection, f.section);
      let s = (100 - f.waitTime * 3) + (100 - distance * 5);
      return { id, score: s, ...f, distanceUnits: distance };
  }).sort((a,b) => b.score - a.score);
  
  let bestFood = foodScores[0];
  let altFood = foodScores[1] || foodScores[0];
  const foodExpl = getExplanation('food', bestFood, altFood);

  // 4. BEST WASHROOM
  let washScores = Object.entries(washrooms).map(([id, w]) => {
      if (wheelchairMode && !w.accessible) return { id, score: -1, ...w };
      let distance = dist(seatSection, w.section);
      let s = (100 - w.waitTime * 4) + (100 - distance * 4);
      return { id, score: s, ...w, distanceUnits: distance };
  }).sort((a,b) => b.score - a.score);

  let bestWashroom = washScores[0];
  let altWash = washScores[1] || washScores[0];
  const washExpl = getExplanation('washroom', bestWashroom, altWash);

  // 5. BEST EXIT
  let exitScores = Object.entries(exits).map(([id, e]) => {
      let s = (100 - e.crowdLevel) + (100 - e.etaMinutes * 6);
      if (familyGroupMode && e.parkingNearby) s += 15;
      return { id, score: s, ...e };
  }).sort((a,b) => b.score - a.score);

  let bestExit = exitScores[0];
  let altExit = exitScores[1] || exitScores[0];
  const exitExpl = getExplanation('exit', bestExit, altExit);

  // 6. SHOULD LEAVE NOW? 
  // Near food/washroom > 70 AND corridor < 50 AND "live-match"
  let shouldLeaveNow = false;
  if (eventPhase === 'live-match') {
      if (bestFood.score > -1 && bestFood.crowdLevel > 60 && corridors.innerNorth.congestion < 50) {
          shouldLeaveNow = true;
      }
  }

  return {
    bestGate: { ...bestGate, reason: gateExpl, alternate: altGate.id },
    bestRoute,
    bestFood: { ...bestFood, reason: foodExpl, alternate: altFood.id },
    bestWashroom: { ...bestWashroom, reason: washExpl, alternate: altWash.id },
    bestExit: { ...bestExit, reason: exitExpl, alternate: altExit.id },
    shouldLeaveNow,
    leaveAdvice: shouldLeaveNow ? "Queue levels are rising rapidly. Go now to save 10+ minutes." : "Wait for halftime",
  };
};
