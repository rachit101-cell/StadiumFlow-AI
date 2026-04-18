import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRecommendations } from '../utils/recommendationEngine';

// Initialize Gemini
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'dummy_key_if_missing';
const genAI = new GoogleGenerativeAI(apiKey);
// Using 1.5 Flash for speed as required
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Simple fast hash for cache keys
const simpleHash = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Cache structure: Map<String, { response: String, timestamp: Number }>
const responseCache = new Map();
const CACHE_TTL = 45 * 1000;

const buildAttendeeContext = (venueState, userProfile) => {
  const recs = getRecommendations(venueState, userProfile);
  const alerts = venueState.activeAlerts.map(a => a.message).join(' | ');
  
  return `
Current venue state:
- Event: ${venueState.eventName}
- Phase: ${venueState.eventPhase}
- User's seat section: ${userProfile.seatSection}
- Nearest gate: Gate ${venueState.sections[userProfile.seatSection].gate} — Congestion: ${venueState.gates[venueState.sections[userProfile.seatSection].gate].congestion}%
- Recommended gate: Gate ${recs.bestGate.id} — Congestion: ${recs.bestGate.congestion}%
- Route corridor status: ${venueState.corridors.innerNorth.congestion}% average (varies by route)
- Nearest food stall: ${recs.bestFood.name} — Wait: ${recs.bestFood.waitTime} min
- Best food stall: ${recs.bestFood.name} — Wait: ${recs.bestFood.waitTime} min
- Nearest washroom wait: ${recs.bestWashroom.waitTime} min
- Best exit: ${recs.bestExit.label} — Crowd: ${recs.bestExit.crowdLevel}%
- Active alerts: ${alerts || 'None'}
- Accessibility mode: ${userProfile.accessibilityMode}
- Family/group mode: ${userProfile.familyGroupMode}, group size: ${userProfile.groupSize}
`;
};

const buildOrganizerContext = (venueState) => {
  const gSummary = Object.entries(venueState.gates).map(([id, g]) => `Gate ${id}:${g.congestion}%`).join(', ');
  const cSummary = Object.entries(venueState.corridors).map(([id, c]) => `${id}:${c.congestion}%`).join(', ');
  const fSummary = Object.entries(venueState.foodStalls).map(([id, f]) => `${f.name}:${f.waitTime}m`).join(', ');
  const wSummary = Object.entries(venueState.washrooms).map(([id, w]) => `${w.label}:${w.waitTime}m`).join(', ');
  const eSummary = Object.entries(venueState.exits).map(([id, e]) => `${e.label}:${e.crowdLevel}%`).join(', ');
  const alertCount = venueState.activeAlerts.length;
  
  // Find highest risk zone
  let max = 0; let riskZone = 'None';
  Object.entries(venueState.gates).forEach(([id,g]) => { if(g.congestion>max){max=g.congestion;riskZone='Gate '+id;} });
  Object.entries(venueState.corridors).forEach(([id,c]) => { if(c.congestion>max){max=c.congestion;riskZone=id;} });

  return `
Full venue state:
- Phase: ${venueState.eventPhase}
- Gate congestion: ${gSummary}
- Corridor status: ${cSummary}
- Food stall queues: ${fSummary}
- Washroom queues: ${wSummary}
- Exit crowd levels: ${eSummary}
- Active alerts count: ${alertCount}
- Highest risk zone: ${riskZone} at ${max}%
`;
};

const attendeeSystemInstruction = `
You are StadiumFlow AI, a real-time matchday assistant for stadium attendees.
Always respond in this exact structure:
**Recommendation:** [one clear directive]
**Why:** [one sentence reason based on live conditions]
**Time Impact:** [ETA in minutes or time saved]
**Backup Option:** [one sentence alternate]

Keep responses concise. Be specific about numbers. Always use live data from the venue state provided.
`;

const organizerSystemInstruction = `
You are StadiumFlow AI's operations assistant for venue organizers.
Always respond in this exact structure:
**Urgency:** [Critical / High / Medium / Low]
**Zone:** [specific zone name]
**Recommended Action:** [operational directive for staff]
**Reason:** [one sentence based on live data]
**Suggested Advisory for Attendees:** [short message to broadcast]

Be direct. Use operational language. Prioritize safety and crowd flow.
`;

export const getGeminiResponse = async (promptText, role, venueState, userProfile) => {
  try {
    const msgHash = simpleHash(promptText);
    const cacheKey = `${venueState.eventPhase}:${userProfile.seatSection}:${msgHash}`;
    
    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return { text: cached.response, isCached: true };
    }

    let systemPrompt = "";
    let contextData = "";

    if (role === 'organizer') {
      systemPrompt = organizerSystemInstruction;
      contextData = buildOrganizerContext(venueState);
    } else {
      systemPrompt = attendeeSystemInstruction;
      contextData = buildAttendeeContext(venueState, userProfile);
    }

    const fullPrompt = `${systemPrompt}\n\n${contextData}\n\nUser Question: ${promptText}`;
    
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    // Store in cache
    responseCache.set(cacheKey, { response: responseText, timestamp: Date.now() });

    return { text: responseText, isCached: false };

  } catch (error) {
    console.error("Gemini API Error", error);
    
    // Graceful fallback card using local recommendation engine
    const recs = getRecommendations(venueState, userProfile);
    let organizerFallbackText = '';
    if (role === 'organizer') {
      let max = 0; let riskZone = 'General';
      let objType = 'gate';
      
      Object.entries(venueState.gates).forEach(([id,g]) => { 
          if(g.congestion>max){max=g.congestion; riskZone=`Gate ${id}`; objType='gate';} 
      });
      Object.entries(venueState.corridors).forEach(([id,c]) => { 
          if(c.congestion>max){max=c.congestion; riskZone=id; objType='corridor';} 
      });

      const urgency = max >= 75 ? 'Critical' : max >= 60 ? 'High' : 'Medium';
      const action = objType === 'gate' ? 'Deploy queue management staff' : 'Open alternate route and redirect crowds';
      
      organizerFallbackText = `Unable to reach AI assistant. Here is a quick suggestion based on current conditions:
**Urgency:** ${urgency}
**Zone:** ${riskZone}
**Recommended Action:** ${action}
**Reason:** Congestion has reached ${max}% capacity.
**Suggested Advisory for Attendees:** Please use alternate routes as ${riskZone} is experiencing high traffic.`;
    }

    const fallbackText = role === 'attendee' ? 
      `Unable to reach AI assistant. Here is a quick suggestion based on current conditions:
**Recommendation:** Proceed to ${recs.bestGate.label || recs.bestFood.name}
**Why:** ${recs.bestGate.reason}
**Time Impact:** Saves approx 5 mins
**Backup Option:** Try Gate ${recs.bestGate.alternate}` 
      : organizerFallbackText;

    return { 
      text: fallbackText,
      isCached: false,
      isErrorFallback: true 
    };
  }
};
