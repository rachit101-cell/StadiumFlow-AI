import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRecommendations } from '../utils/recommendationEngine';

// ─── Initialise Gemini ───────────────────────────────────────────────────────
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const hasValidKey = apiKey && apiKey !== 'your_key_here' && apiKey.length > 10;

const genAI = hasValidKey ? new GoogleGenerativeAI(apiKey) : null;
const model = hasValidKey ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;

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
const CACHE_TTL = 45 * 1000;

// One pending request at a time to prevent rate-limit bursts
let pendingRequest = null;

// ─── Greeting / filler / help detector ──────────────────────────────────────
const GREETING_RE = /^(hi|hello|hey|howdy|hiya|good\s*(morning|afternoon|evening|day)|what('s| is) up|sup|greetings|yo|namaste|vanakkam|salaam|how are you|how r u)[\s!?.]*$/i;
const FILLER_RE   = /^(ok|okay|thanks|thank you|ty|thx|cool|great|nice|awesome|got it|sure|alright|bye|goodbye|yes|no|yep|nope|fine|good|test|testing)[\s!?.]*$/i;
const HELP_RE     = /^(what\s*(to\s*do|can\s*(you|i|we)\s*do|are\s*(my\s*)?options|should\s*i\s*do|do\s*i\s*do|now)|help(\s*me)?|assist|how\s*(does\s*this|do\s*you|can\s*you|can\s*i)\s*(work|help)?|what\s*features|features|capabilities|guide\s*me|get\s*started|start|menu|options)[\s!?.]*$/i;

const getHelpReply = (role, venueState) => {
  const phase = venueState?.eventPhase?.replace(/-/g, ' ') || 'pre-match';
  if (role === 'organizer') {
    return `Here is what I can help you with during **${phase}** phase:\n\n\u{1F534} **Zone monitoring** — Ask: "Highest risk zone now"\n\u{1F465} **Staff deployment** — Ask: "Where to deploy staff?"\n\u{1F6AA} **Exit management** — Ask: "Which exit needs support?"\n\u{1F354} **Queue management** — Ask: "Should I open another counter?"\n\u{1F4E2} **Advisories** — Ask: "What advisory to send?"\n\nOr describe any situation and I will advise accordingly.`;
  }
  return `Here is what I can help you with during **${phase}** phase:\n\n\u{1F6AA} **Gate entry** — Ask: "Best gate for me"\n\u{1F5FA} **Navigation** — Ask: "Route to my seat"\n\u{1F354} **Food** — Ask: "Best food now"\n\u{1F6BB} **Washrooms** — Ask: "Nearest washroom"\n\u{1F6B6} **Timing** — Ask: "Should I leave now?"\n\u{1F3C3} **Exit planning** — Ask: "Best exit after match"\n\nOr ask me anything — I know your section and the live venue conditions right now.`;
};

const getCasualReply = (role, venueState, userProfile) => {
  const name  = userProfile?.name && userProfile.name !== 'Guest' ? userProfile.name : null;
  const phase = venueState?.eventPhase?.replace(/-/g, ' ') || 'pre-match';
  const event = venueState?.eventName || 'the match';

  if (role === 'organizer') {
    return `Hi! I'm your StadiumFlow AI operations assistant. The venue is in **${phase}** phase for **${event}**.\n\nAsk me about zone congestion, staff deployment, crowd management, or advisories.`;
  }
  const greeting = name ? `Hi ${name}!` : 'Hi there!';
  return `${greeting} I'm StadiumFlow AI — your personal matchday guide.\n\nThe event is in **${phase}** phase. I can help with gate recommendations, routes, food queues, washrooms, exit planning, and more. What do you need?`;
};

// ─── Local quick-action resolver (no API call needed) ────────────────────────
// Maps normalized chip text → a function that returns structured response text
const resolveLocalAttendee = (normalized, recs, venueState, userProfile) => {
  const { bestGate, bestRoute, bestFood, bestWashroom, bestExit, shouldLeaveNow, leaveAdvice } = recs;
  const phase = venueState.eventPhase;
  const section = userProfile.seatSection || 'E';

  if (/best gate/.test(normalized)) {
    return `**Recommendation:** Use Gate ${bestGate.id} — ${bestGate.label}\n**Why:** ${bestGate.reason}\n**Time Impact:** ~${bestGate.eta} min entry time\n**Backup Option:** Gate ${bestGate.alternate} is the next best option`;
  }
  if (/route|seat/.test(normalized)) {
    const path = bestRoute.path.join(' → ');
    const warn = venueState.corridors.innerNorth.congestion > 65 ? ' (warning: inner corridor is congested)' : '';
    return `**Recommendation:** ${path}\n**Why:** ${bestRoute.reason}${warn}\n**Time Impact:** ~${bestRoute.etaMinutes} min to reach Section ${section}\n**Backup Option:** Follow staff directions if the inner corridor is blocked`;
  }
  if (/washroom/.test(normalized)) {
    return `**Recommendation:** Head to ${bestWashroom.label}\n**Why:** ${bestWashroom.reason}\n**Time Impact:** ~${bestWashroom.waitTime} min wait, ${bestWashroom.distanceUnits * 2 || 3} min walk\n**Backup Option:** ${bestWashroom.alternate ? `Try ${bestWashroom.alternate}` : 'Any nearby washroom'}`;
  }
  if (/food/.test(normalized)) {
    return `**Recommendation:** Visit ${bestFood.name} (near ${bestFood.near})\n**Why:** ${bestFood.reason}\n**Time Impact:** ~${bestFood.waitTime} min wait\n**Backup Option:** ${bestFood.alternate || 'Next nearest food stall'} has shorter queues`;
  }
  if (/leave|should i/.test(normalized)) {
    if (shouldLeaveNow) {
      return `**Recommendation:** Leave your seat NOW\n**Why:** ${leaveAdvice}\n**Time Impact:** Saves approximately 10+ minutes\n**Backup Option:** If you miss the window, wait until queues clear`;
    }
    return `**Recommendation:** Stay at your seat for now\n**Why:** ${leaveAdvice} — corridors are clear for a quick exit when you're ready\n**Time Impact:** No wait risk at this time\n**Backup Option:** Leave 5 minutes before halftime ends to beat the rush`;
  }
  if (/exit/.test(normalized)) {
    return `**Recommendation:** Use ${bestExit.label}\n**Why:** ${bestExit.reason}\n**Time Impact:** ~${bestExit.etaMinutes} min to reach exit\n**Backup Option:** ${bestExit.alternate ? `${bestExit.alternate} Exit` : 'Any less crowded exit'}`;
  }
  if (/congestion|crowd/.test(normalized)) {
    const worstGate = Object.entries(venueState.gates).sort((a,b) => b[1].congestion - a[1].congestion)[0];
    const bestGateEntry = Object.entries(venueState.gates).sort((a,b) => a[1].congestion - b[1].congestion)[0];
    return `**Recommendation:** Avoid Gate ${worstGate[0]} (${worstGate[1].congestion}% congestion)\n**Why:** Gate ${bestGateEntry[0]} is the least congested entry point right now at ${bestGateEntry[1].congestion}%\n**Time Impact:** Using Gate ${bestGateEntry[0]} saves ~5 min over Gate ${worstGate[0]}\n**Backup Option:** Gate ${bestGate.id} is your personalized recommendation based on your section`;
  }
  return null; // Not a known chip — fall through to Gemini
};

const resolveLocalOrganizer = (normalized, venueState) => {
  const gates = Object.entries(venueState.gates).sort((a,b) => b[1].congestion - a[1].congestion);
  const exits  = Object.entries(venueState.exits).sort((a,b) => b[1].crowdLevel - a[1].congestion);
  const stalls = Object.entries(venueState.foodStalls).sort((a,b) => b[1].waitTime - a[1].waitTime);

  const [worstGateId, worstGate] = gates[0];
  const urgency = worstGate.congestion >= 80 ? 'Critical' : worstGate.congestion >= 65 ? 'High' : 'Medium';

  if (/risk|worst|critical/.test(normalized)) {
    return `**Urgency:** ${urgency}\n**Zone:** Gate ${worstGateId}\n**Recommended Action:** Deploy queue management staff to Gate ${worstGateId} immediately\n**Reason:** Congestion is at ${worstGate.congestion}%, the highest across all gates\n**Suggested Advisory for Attendees:** Gate ${worstGateId} is experiencing high traffic. Please use Gate ${gates[gates.length-1][0]} as an alternative.`;
  }
  if (/staff|deploy/.test(normalized)) {
    return `**Urgency:** ${urgency}\n**Zone:** Gate ${worstGateId} and adjacent corridors\n**Recommended Action:** Redirect 2–3 staff from low-traffic gates to Gate ${worstGateId} and inner corridors\n**Reason:** Gate ${worstGateId} at ${worstGate.congestion}% is the primary bottleneck\n**Suggested Advisory for Attendees:** Please follow staff directions near Gate ${worstGateId}.`;
  }
  if (/exit/.test(normalized)) {
    const [worstExitId, worstExit] = exits[0];
    return `**Urgency:** ${worstExit.crowdLevel >= 80 ? 'Critical' : 'High'}\n**Zone:** ${worstExit.label}\n**Recommended Action:** Station crowd control staff at ${worstExit.label} and open overflow lanes\n**Reason:** Exit crowd at ${worstExit.crowdLevel}% — highest of all exits\n**Suggested Advisory for Attendees:** ${worstExit.label} is busy. Consider using the East or West exits.`;
  }
  if (/counter|food|queue/.test(normalized)) {
    const [, topStall] = stalls[0];
    const needsCounter = topStall.waitTime > 8;
    return `**Urgency:** ${needsCounter ? 'High' : 'Medium'}\n**Zone:** ${topStall.name}\n**Recommended Action:** ${needsCounter ? `Open an additional service counter at ${topStall.name}` : 'Monitor queue levels — no immediate action needed'}\n**Reason:** ${topStall.name} has the highest wait time at ${topStall.waitTime} min\n**Suggested Advisory for Attendees:** ${needsCounter ? `Avoid ${topStall.name} — try a nearby stall for shorter wait times.` : 'Food stall queues are manageable at this time.'}`;
  }
  if (/advisory|message|broadcast/.test(normalized)) {
    return `**Urgency:** ${urgency}\n**Zone:** Venue-wide\n**Recommended Action:** Review and approve an advisory using the AI Recommendations panel\n**Reason:** Current phase is ${venueState.eventPhase.replace(/-/g, ' ')} with Gate ${worstGateId} at ${worstGate.congestion}% congestion\n**Suggested Advisory for Attendees:** For a smoother experience, please use Gate ${gates[gates.length-1][0]} which has significantly lower wait times right now.`;
  }
  return null; // Not a known chip — fall through to Gemini
};

// ─── Context builders ────────────────────────────────────────────────────────
const buildAttendeeContext = (venueState, userProfile) => {
  const recs    = getRecommendations(venueState, userProfile);
  const alerts  = venueState.activeAlerts.map(a => a.message).join(' | ');
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

IMPORTANT: Only use the structured format below for venue/navigation questions. For greetings, general questions, or anything unrelated to crowds/routes — respond naturally in plain conversational text.

Structured format (venue questions only):
**Recommendation:** [one clear directive]
**Why:** [one sentence reason based on live conditions]
**Time Impact:** [ETA in minutes or time saved]
**Backup Option:** [one sentence alternate]

Be helpful, warm, and concise.
`;

const organizerSystemInstruction = `
You are StadiumFlow AI, a real-time operations assistant for venue organizers.

IMPORTANT: Only use the structured format below for operational/zone questions. For greetings or general inquiries — respond naturally in plain conversational text.

Structured format (operational questions only):
**Urgency:** [Critical / High / Medium / Low]
**Zone:** [specific zone name]
**Recommended Action:** [operational directive for staff]
**Reason:** [one sentence based on live data]
**Suggested Advisory for Attendees:** [short message to broadcast]

Be direct and professional.
`;

// ─── Main export ─────────────────────────────────────────────────────────────
export const getGeminiResponse = async (promptText, role, venueState, userProfile) => {
  const trimmed    = promptText.trim();
  const normalized = trimmed.toLowerCase();

  // 1. Handle greetings/filler locally — instant, no API
  if (GREETING_RE.test(trimmed) || FILLER_RE.test(trimmed)) {
    return { text: getCasualReply(role, venueState, userProfile), isCached: false, isErrorFallback: false, isLocal: true };
  }

  // 1b. Handle help / "what to do" / capabilities queries locally
  if (HELP_RE.test(trimmed)) {
    return { text: getHelpReply(role, venueState), isCached: false, isErrorFallback: false, isLocal: true };
  }


  // 2. Resolve quick-action chips locally — instant, no API, no rate limits
  const recs = getRecommendations(venueState, userProfile);
  const localText = role === 'organizer'
    ? resolveLocalOrganizer(normalized, venueState)
    : resolveLocalAttendee(normalized, recs, venueState, userProfile);

  if (localText) {
    return { text: localText, isCached: false, isErrorFallback: false, isLocal: true };
  }

  // 3. No valid API key — return a helpful error
  if (!hasValidKey) {
    return {
      text: `⚠️ No Gemini API key configured.\n\nAdd your key to the **.env** file:\n\`VITE_GEMINI_API_KEY=your_key_here\`\n\nGet a free key at aistudio.google.com, then restart the dev server.`,
      isCached: false,
      isErrorFallback: true,
    };
  }

  // 4. Check cache
  const msgHash  = simpleHash(normalized);
  const section  = userProfile?.seatSection || 'none';
  const cacheKey = `${role}:${venueState.eventPhase}:${section}:${msgHash}`;

  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { text: cached.response, isCached: true, isErrorFallback: false };
  }

  // 5. Queue API calls — wait for any pending request first to avoid burst 429s
  if (pendingRequest) {
    try { await pendingRequest; } catch (_) { /* ignore inner error */ }
  }

  // 6. Call Gemini for open-ended / freeform questions
  const systemPrompt = role === 'organizer' ? organizerSystemInstruction : attendeeSystemInstruction;
  const contextData  = role === 'organizer'
    ? buildOrganizerContext(venueState)
    : buildAttendeeContext(venueState, userProfile);

  const fullPrompt = `${systemPrompt}\n\n${contextData}\n\nUser: ${trimmed}`;

  pendingRequest = (async () => {
    try {
      const result       = await model.generateContent(fullPrompt);
      const responseText = result.response.text();
      responseCache.set(cacheKey, { response: responseText, timestamp: Date.now() });
      return { text: responseText, isCached: false, isErrorFallback: false };
    } catch (error) {
      console.error('Gemini API Error:', error);
      const msg = error?.message || '';
      const errorText = msg.includes('429') || msg.includes('quota')
        ? '⚠️ Gemini rate limit reached. Please wait a moment and try again.'
        : msg.includes('API_KEY') || msg.includes('403')
        ? '⚠️ Invalid Gemini API key. Check your VITE_GEMINI_API_KEY in the .env file.'
        : msg.includes('404')
        ? '⚠️ Model not available. The Gemini API may be temporarily unavailable.'
        : `⚠️ AI assistant temporarily unavailable. Please try again.\n\n(${msg})`;
      return { text: errorText, isCached: false, isErrorFallback: true };
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
};
