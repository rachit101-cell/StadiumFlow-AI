import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRecommendations } from '../utils/recommendationEngine';

// ─── Initialise Gemini ───────────────────────────────────────────────────────
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const hasValidKey = apiKey && apiKey !== 'your_key_here' && apiKey.length > 10;

const genAI  = hasValidKey ? new GoogleGenerativeAI(apiKey) : null;
const model  = hasValidKey ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;

// ─── Response cache ──────────────────────────────────────────────────────────
const simpleHash = str => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = ((h << 5) - h) + c;
    h = h & h;
  }
  return h.toString(36);
};

const responseCache = new Map();
const CACHE_TTL = 45 * 1000; // 45 seconds

// ─── Greeting / casual-message detector ─────────────────────────────────────
const GREETING_PATTERNS = /^(hi|hello|hey|howdy|hiya|good\s*(morning|afternoon|evening|day)|what('s| is) up|sup|greetings|yo|helo|hii+|heyy+|namaste|vanakkam|salaam|how are you|how r u|how do you do)[\s!?.]*$/i;

const FILLER_PATTERNS = /^(ok|okay|thanks|thank you|ty|thx|cool|great|nice|awesome|got it|sure|alright|bye|goodbye|see you|cya|later|yes|no|yep|nope|fine|good|bad|test|testing|1|2|3|abc)[\s!?.]*$/i;

const getCasualReply = (role, venueState, userProfile) => {
  const name   = userProfile?.name && userProfile.name !== 'Guest' ? userProfile.name : null;
  const phase  = venueState?.eventPhase?.replace(/-/g, ' ') || 'pre-match';
  const event  = venueState?.eventName || 'the match';

  if (role === 'organizer') {
    return `Hi! I'm your StadiumFlow AI operations assistant. The venue is currently in **${phase}** phase for **${event}**. You can ask me about zone congestion, staff deployment, crowd management, AI advisories, or anything else about the venue. What do you need?`;
  }

  const greeting = name ? `Hi ${name}!` : 'Hi there!';
  return `${greeting} I'm StadiumFlow AI, your personal matchday assistant. The event is currently in **${phase}** phase. I can help you with gate recommendations, routes to your seat, food stall wait times, washroom queues, exit planning, or anything else about the venue. What would you like to know?`;
};

// ─── Context builders ────────────────────────────────────────────────────────
const buildAttendeeContext = (venueState, userProfile) => {
  const recs   = getRecommendations(venueState, userProfile);
  const alerts = venueState.activeAlerts.map(a => a.message).join(' | ');
  const section = userProfile.seatSection || 'E';
  const nearGate = venueState.sections[section]?.gate || 'A';

  return `
Current venue state:
- Event: ${venueState.eventName}
- Phase: ${venueState.eventPhase}
- User seat section: ${section}
- Nearest gate: Gate ${nearGate} — Congestion: ${venueState.gates[nearGate]?.congestion ?? '?'}%
- Recommended gate: Gate ${recs.bestGate.id} — Congestion: ${recs.bestGate.congestion}%
- Inner corridor congestion: ${venueState.corridors.innerNorth.congestion}%
- Best food stall: ${recs.bestFood.name} — Wait: ${recs.bestFood.waitTime} min
- Nearest washroom wait: ${recs.bestWashroom.waitTime} min
- Best exit: ${recs.bestExit.label} — Crowd: ${recs.bestExit.crowdLevel}%
- Active alerts: ${alerts || 'None'}
- Accessibility mode: ${userProfile.accessibilityMode ? 'Enabled (stair-free routing)' : 'Disabled'}
- Family/group mode: ${userProfile.familyGroupMode ? `Enabled, group of ${userProfile.groupSize}` : 'Disabled'}
`;
};

const buildOrganizerContext = (venueState) => {
  const gSummary = Object.entries(venueState.gates).map(([id, g]) => `Gate ${id}: ${g.congestion}%`).join(', ');
  const cSummary = Object.entries(venueState.corridors).map(([id, c]) => `${id}: ${c.congestion}%`).join(', ');
  const fSummary = Object.entries(venueState.foodStalls).map(([, f]) => `${f.name}: ${f.waitTime}m wait`).join(', ');
  const wSummary = Object.entries(venueState.washrooms).map(([, w]) => `${w.label}: ${w.waitTime}m wait`).join(', ');
  const eSummary = Object.entries(venueState.exits).map(([, e]) => `${e.label}: ${e.crowdLevel}%`).join(', ');

  let max = 0; let riskZone = 'None';
  Object.entries(venueState.gates).forEach(([id, g]) => { if (g.congestion > max) { max = g.congestion; riskZone = `Gate ${id}`; } });
  Object.entries(venueState.corridors).forEach(([id, c]) => { if (c.congestion > max) { max = c.congestion; riskZone = id; } });

  return `
Full venue state:
- Phase: ${venueState.eventPhase}
- Gate congestion: ${gSummary}
- Corridor status: ${cSummary}
- Food stall queues: ${fSummary}
- Washroom queues: ${wSummary}
- Exit crowd levels: ${eSummary}
- Active alerts: ${venueState.activeAlerts.length}
- Highest risk zone: ${riskZone} at ${max}%
`;
};

// ─── System instructions ─────────────────────────────────────────────────────
const attendeeSystemInstruction = `
You are StadiumFlow AI, a friendly real-time matchday assistant for stadium attendees.

IMPORTANT: Only use the structured format below when the user asks specifically about gates, routes, food, washrooms, exits, crowds, or navigation. For greetings, general questions, event info, or anything unrelated to venue navigation — respond naturally in plain conversational text.

Structured format (for venue/navigation questions only):
**Recommendation:** [one clear directive]
**Why:** [one sentence reason based on live conditions]
**Time Impact:** [ETA in minutes or time saved]
**Backup Option:** [one sentence alternate]

Be helpful, warm, and concise. Use numbers from the live venue data provided.
`;

const organizerSystemInstruction = `
You are StadiumFlow AI, a real-time operations assistant for venue organizers.

IMPORTANT: Only use the structured format below when the user asks specifically about zone management, staffing, crowd control, advisories, or congestion. For greetings, general inquiries, or non-operational questions — respond naturally in plain conversational text.

Structured format (for operational/zone questions only):
**Urgency:** [Critical / High / Medium / Low]
**Zone:** [specific zone name]
**Recommended Action:** [operational directive for staff]
**Reason:** [one sentence based on live data]
**Suggested Advisory for Attendees:** [short message to broadcast]

Be direct and professional. Prioritize safety and crowd flow.
`;

// ─── Main export ─────────────────────────────────────────────────────────────
export const getGeminiResponse = async (promptText, role, venueState, userProfile) => {
  const trimmed = promptText.trim();

  // 1. Handle greetings/filler locally — no API call needed
  if (GREETING_PATTERNS.test(trimmed) || FILLER_PATTERNS.test(trimmed)) {
    return {
      text: getCasualReply(role, venueState, userProfile),
      isCached: false,
      isErrorFallback: false,
      isLocal: true,
    };
  }

  // 2. No valid API key — return a helpful plain-text error
  if (!hasValidKey) {
    return {
      text: `⚠️ No Gemini API key configured.\n\nTo enable AI responses, add your key to the **.env** file:\n\`VITE_GEMINI_API_KEY=your_key_here\`\n\nGet a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey), then restart the dev server.`,
      isCached: false,
      isErrorFallback: true,
    };
  }

  // 3. Try cache
  const msgHash  = simpleHash(trimmed.toLowerCase());
  const section  = userProfile?.seatSection || 'none';
  const cacheKey = `${role}:${venueState.eventPhase}:${section}:${msgHash}`;

  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { text: cached.response, isCached: true, isErrorFallback: false };
  }

  // 4. Build prompt and call Gemini
  try {
    const systemPrompt = role === 'organizer' ? organizerSystemInstruction : attendeeSystemInstruction;
    const contextData  = role === 'organizer'
      ? buildOrganizerContext(venueState)
      : buildAttendeeContext(venueState, userProfile);

    const fullPrompt = `${systemPrompt}\n\n${contextData}\n\nUser: ${trimmed}`;

    const result       = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    responseCache.set(cacheKey, { response: responseText, timestamp: Date.now() });
    return { text: responseText, isCached: false, isErrorFallback: false };

  } catch (error) {
    console.error('Gemini API Error:', error);

    // Return a plain-text error — NOT fake structured venue data
    const errorMsg = error?.message?.includes('API_KEY')
      ? '⚠️ Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in the .env file.'
      : error?.message?.includes('quota') || error?.message?.includes('429')
      ? '⚠️ Gemini API rate limit reached. Please wait a moment and try again.'
      : `⚠️ AI assistant temporarily unavailable. Please try again in a moment.\n\n(Error: ${error?.message || 'Unknown error'})`;

    return {
      text: errorMsg,
      isCached: false,
      isErrorFallback: true,
    };
  }
};
