import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import DOMPurify from 'dompurify';
import { getRecommendations } from '../utils/recommendationEngine';
import { SIMULATION, PHASES } from '../constants/venue';

// ─── API Key Guard ────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || API_KEY.length <= 10) {
  console.error(
    'VITE_GEMINI_API_KEY is not set. ' +
    'Create a .env file with your Gemini API key. ' +
    'See .env.example for the required format.'
  );
}

const hasValidKey = Boolean(API_KEY && API_KEY !== 'your_gemini_api_key_here' && API_KEY.length > 10);

// ─── Gemini Generation Config ─────────────────────────────────────────────────
const generationConfig = {
  temperature: 0.4,
  topK: 32,
  topP: 0.85,
  maxOutputTokens: 256,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,   threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const genAI = hasValidKey ? new GoogleGenerativeAI(API_KEY) : null;
const model = hasValidKey
  ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig, safetySettings })
  : null;

// ─── Gemini Usage Metrics ─────────────────────────────────────────────────────
/**
 * Tracks Gemini API usage metrics for the AI Performance dashboard card.
 */
export const geminiMetrics = {
  totalCalls: 0,
  cacheHits: 0,
  errors: 0,
  responseTimes: [],

  /**
   * Records an API call result for metrics tracking.
   * @param {number} durationMs - Response time in ms
   * @param {boolean} fromCache - Whether this was a cache hit
   * @param {boolean} isError - Whether this call errored
   */
  recordCall(durationMs, fromCache = false, isError = false) {
    this.totalCalls++;
    if (fromCache) this.cacheHits++;
    if (isError) this.errors++;
    if (!fromCache && !isError && durationMs > 0) {
      this.responseTimes.push(durationMs);
    }
  },

  /**
   * Returns a formatted summary of Gemini usage metrics.
   * @returns {{ totalCalls: number, cacheHitRate: string, errorRate: string, averageResponseMs: number }}
   */
  getSummary() {
    const avg = this.responseTimes.length > 0
      ? Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length)
      : 0;
    return {
      totalCalls: this.totalCalls,
      cacheHitRate: this.totalCalls > 0
        ? `${Math.round((this.cacheHits / this.totalCalls) * 100)}%`
        : '0%',
      errorRate: this.totalCalls > 0
        ? `${Math.round((this.errors / this.totalCalls) * 100)}%`
        : '0%',
      averageResponseMs: avg,
    };
  },
};

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const rateLimiter = {
  calls: [],
  maxCalls: 10,
  windowMs: 60000,

  /**
   * Checks if a new API call is permitted under the rate limit.
   * Allows a maximum of 10 calls per 60-second rolling window.
   * @returns {boolean} True if call is permitted, false if rate limited
   */
  isAllowed() {
    const now = Date.now();
    this.calls = this.calls.filter(t => now - t < this.windowMs);
    if (this.calls.length >= this.maxCalls) return false;
    this.calls.push(now);
    return true;
  },
};

// ─── LRU Response Cache ───────────────────────────────────────────────────────
const responseCache = new Map();

/**
 * Generates a simple hash from a string for use as a cache key segment.
 * @param {string} str - Input string
 * @returns {string} Base-36 hash string
 */
const simpleHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = ((h << 5) - h) + c;
    h = h & h;
  }
  return h.toString(36);
};

/**
 * Retrieves a cached Gemini response if it exists and has not expired.
 * @param {string} cacheKey - The cache lookup key
 * @returns {string|null} Cached response text or null on miss/expiry
 */
export function getCachedResponse(cacheKey) {
  if (!responseCache.has(cacheKey)) return null;
  const { response, timestamp } = responseCache.get(cacheKey);
  if (Date.now() - timestamp > SIMULATION.CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }
  return response;
}

/**
 * Stores a response in the LRU cache, evicting the oldest entry if at capacity.
 * @param {string} cacheKey - The cache key
 * @param {string} response - The response text to cache
 */
function setCache(cacheKey, response) {
  if (responseCache.size >= SIMULATION.CACHE_MAX_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
}

// ─── Input Sanitization ───────────────────────────────────────────────────────
/**
 * Sanitizes user input to prevent prompt injection attacks.
 * Strips characters and patterns that could manipulate the system prompt structure.
 *
 * @param {string} input - Raw user input string
 * @returns {string} Sanitized input safe for inclusion in Gemini prompts
 */
function sanitizeUserInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, 500)
    .replace(/[<>]/g, '')
    .replace(/\{|\}/g, '')
    .replace(/system:|assistant:|user:/gi, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/\n{3,}/g, '\n\n');
}

// ─── Output Sanitization ──────────────────────────────────────────────────────
/**
 * Sanitizes a Gemini API response string to prevent XSS.
 * All Gemini output is rendered as plain text via JSX — no HTML injection surface.
 * DOMPurify is applied as a defense-in-depth measure for any future dangerouslySetInnerHTML use.
 *
 * @param {string} rawResponse - Raw response text from Gemini API
 * @returns {string} Sanitized response text safe for rendering
 */
export function sanitizeGeminiOutput(rawResponse) {
  if (typeof rawResponse !== 'string') return '';
  // All Gemini output is rendered as plain text via JSX — no HTML injection surface.
  // DOMPurify provides defense-in-depth if rendering approach changes in the future.
  if (typeof window !== 'undefined' && DOMPurify.isSupported) {
    return DOMPurify.sanitize(rawResponse, {
      ALLOWED_TAGS: ['b', 'strong', 'em', 'br'],
      ALLOWED_ATTR: [],
    });
  }
  return rawResponse;
}

// One pending request at a time to prevent rate-limit bursts
let pendingRequest = null;

// ─── Greeting / Help Detectors ────────────────────────────────────────────────
const GREETING_RE = /^(hi|hello|hey|howdy|hiya|good\s*(morning|afternoon|evening|day)|what('s| is) up|sup|greetings|yo|namaste|vanakkam|salaam|how are you|how r u)[\s!?.]*$/i;
const FILLER_RE   = /^(ok|okay|thanks|thank you|ty|thx|cool|great|nice|awesome|got it|sure|alright|bye|goodbye|yes|no|yep|nope|fine|good|test|testing)[\s!?.]*$/i;
const HELP_RE     = /^(what\s*(to\s*do|can\s*(you|i|we)\s*do|are\s*(my\s*)?options|should\s*i\s*do|do\s*i\s*do|now)|help(\s*me)?|assist|how\s*(does\s*this|do\s*you|can\s*you|can\s*i)\s*(work|help)?|what\s*features|features|capabilities|guide\s*me|get\s*started|start|menu|options)[\s!?.]*$/i;

/**
 * Returns a contextual help menu response without calling the API.
 * @param {string} role - 'attendee' | 'organizer'
 * @param {Object} venueState - Current venue state
 * @returns {string} Formatted help text
 */
const getHelpReply = (role, venueState) => {
  const phase = venueState?.eventPhase?.replace(/-/g, ' ') || 'pre-match';
  if (role === PHASES.ORGANIZER || role === 'organizer') {
    return `Here is what I can help you with during **${phase}** phase:\n\n🔴 **Zone monitoring** — Ask: "Highest risk zone now"\n👥 **Staff deployment** — Ask: "Where to deploy staff?"\n🚪 **Exit management** — Ask: "Which exit needs support?"\n🍔 **Queue management** — Ask: "Should I open another counter?"\n📢 **Advisories** — Ask: "What advisory to send?"\n\nOr describe any situation and I will advise accordingly.`;
  }
  return `Here is what I can help you with during **${phase}** phase:\n\n🚪 **Gate entry** — Ask: "Best gate for me"\n🗺 **Navigation** — Ask: "Route to my seat"\n🍔 **Food** — Ask: "Best food now"\n🚻 **Washrooms** — Ask: "Nearest washroom"\n🚶 **Timing** — Ask: "Should I leave now?"\n🏃 **Exit planning** — Ask: "Best exit after match"\n\nOr ask me anything — I know your section and the live venue conditions right now.`;
};

/**
 * Returns a casual greeting response without calling the API.
 * @param {string} role - 'attendee' | 'organizer'
 * @param {Object} venueState - Current venue state
 * @param {Object} userProfile - User profile
 * @returns {string} Formatted greeting text
 */
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

// ─── Local Quick-Action Resolvers ─────────────────────────────────────────────
/**
 * Resolves attendee quick-action chip phrases to instant responses without API calls.
 * @param {string} normalized - Lowercased user message
 * @param {Object} recs - Result from getRecommendations
 * @param {Object} venueState - Current venue state
 * @param {Object} userProfile - User profile
 * @returns {string|null} Response text or null if no local match
 */
const resolveLocalAttendee = (normalized, recs, venueState, userProfile) => {
  const { bestGate, bestRoute, bestFood, bestWashroom, bestExit, shouldLeaveNow, leaveAdvice } = recs;
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
    return `**Recommendation:** Head to ${bestWashroom.label}\n**Why:** ${bestWashroom.reason}\n**Time Impact:** ~${bestWashroom.waitTime} min wait, ${(bestWashroom.distanceUnits || 0) * 2 || 3} min walk\n**Backup Option:** ${bestWashroom.alternate ? `Try ${bestWashroom.alternate}` : 'Any nearby washroom'}`;
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
    const worstGate = Object.entries(venueState.gates).sort((a, b) => b[1].congestion - a[1].congestion)[0];
    const bestGateEntry = Object.entries(venueState.gates).sort((a, b) => a[1].congestion - b[1].congestion)[0];
    return `**Recommendation:** Avoid Gate ${worstGate[0]} (${worstGate[1].congestion}% congestion)\n**Why:** Gate ${bestGateEntry[0]} is the least congested entry point right now at ${bestGateEntry[1].congestion}%\n**Time Impact:** Using Gate ${bestGateEntry[0]} saves ~5 min over Gate ${worstGate[0]}\n**Backup Option:** Gate ${bestGate.id} is your personalized recommendation based on your section`;
  }
  return null;
};

/**
 * Resolves organizer quick-action chip phrases to instant responses without API calls.
 * @param {string} normalized - Lowercased user message
 * @param {Object} venueState - Current venue state
 * @returns {string|null} Response text or null if no local match
 */
const resolveLocalOrganizer = (normalized, venueState) => {
  const gates  = Object.entries(venueState.gates).sort((a, b) => b[1].congestion - a[1].congestion);
  const exits  = Object.entries(venueState.exits).sort((a, b) => b[1].crowdLevel - a[1].crowdLevel);
  const stalls = Object.entries(venueState.foodStalls).sort((a, b) => b[1].waitTime - a[1].waitTime);
  const [worstGateId, worstGate] = gates[0];
  const urgency = worstGate.congestion >= 80 ? 'Critical' : worstGate.congestion >= 65 ? 'High' : 'Medium';

  if (/risk|worst|critical/.test(normalized)) {
    return `**Urgency:** ${urgency}\n**Zone:** Gate ${worstGateId}\n**Recommended Action:** Deploy queue management staff to Gate ${worstGateId} immediately\n**Reason:** Congestion is at ${worstGate.congestion}%, the highest across all gates\n**Suggested Advisory for Attendees:** Gate ${worstGateId} is experiencing high traffic. Please use Gate ${gates[gates.length - 1][0]} as an alternative.`;
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
    return `**Urgency:** ${urgency}\n**Zone:** Venue-wide\n**Recommended Action:** Review and approve an advisory using the AI Recommendations panel\n**Reason:** Current phase is ${venueState.eventPhase.replace(/-/g, ' ')} with Gate ${worstGateId} at ${worstGate.congestion}% congestion\n**Suggested Advisory for Attendees:** For a smoother experience, please use Gate ${gates[gates.length - 1][0]} which has significantly lower wait times right now.`;
  }
  return null;
};

// ─── Context Builders ─────────────────────────────────────────────────────────
/**
 * Builds the full system prompt context string for attendee queries.
 * Includes live venue state and personalized user data for context-aware responses.
 *
 * @param {Object} venueState - The current venue state from VenueContext
 * @param {Object} userProfile - The user profile from UserContext
 * @returns {string} Context string for injection into the Gemini prompt
 */
export const buildAttendeeContext = (venueState, userProfile) => {
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
- Food preference: ${userProfile.foodPreference}

Respond with:
**Recommendation:** [one clear directive]
**Why:** [one sentence reason based on live conditions]
**Time Impact:** [ETA in minutes or time saved]
**Backup Option:** [one sentence alternate]
`;
};

/**
 * Builds the full system prompt context string for organizer queries.
 * Includes full venue-wide congestion, stall, exit, and alert summary.
 *
 * @param {Object} venueState - The current venue state from VenueContext
 * @returns {string} Context string for injection into the Gemini prompt
 */
export const buildOrganizerContext = (venueState) => {
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

Respond with:
**Urgency:** [Critical / High / Medium / Low]
**Zone:** [specific zone name]
**Recommended Action:** [operational directive for staff]
**Reason:** [one sentence based on live data]
**Suggested Advisory for Attendees:** [short message to broadcast]
`;
};

// ─── System Instructions ──────────────────────────────────────────────────────
const attendeeSystemInstruction = `
You are StadiumFlow AI, a friendly real-time matchday assistant for stadium attendees.

IMPORTANT: Only use the structured format below for venue/navigation questions. For greetings, general questions, or anything unrelated to crowds/routes — respond naturally in plain conversational text.

Be helpful, warm, and concise.
`;

const organizerSystemInstruction = `
You are StadiumFlow AI, a real-time operations assistant for venue organizers.

IMPORTANT: Only use the structured format below for operational/zone questions. For greetings or general inquiries — respond naturally in plain conversational text.

Be direct and professional.
`;

// ─── Streaming Response ───────────────────────────────────────────────────────
/**
 * Streams a Gemini response as an async generator, yielding chunks of data.
 * Fully integrates local resolvers, caching, and rate limiting.
 *
 * @param {string} promptText - Raw user message
 * @param {string} role - 'attendee' | 'organizer'
 * @param {Object} venueState - Current venue state from VenueContext
 * @param {Object} userProfile - User profile from UserContext
 * @returns {AsyncGenerator<{ chunk: string, isCached?: boolean, isErrorFallback?: boolean, isLocal?: boolean }>}
 */
export async function* streamGeminiResponse(promptText, role, venueState, userProfile) {
  const sanitized  = sanitizeUserInput(promptText);
  const normalized = sanitized.toLowerCase();

  // 1. Handle greetings/filler locally — instant, no API
  if (GREETING_RE.test(sanitized) || FILLER_RE.test(sanitized)) {
    yield { chunk: getCasualReply(role, venueState, userProfile), isCached: false, isErrorFallback: false, isLocal: true };
    return;
  }

  // 2. Handle help / "what to do" locally
  if (HELP_RE.test(sanitized)) {
    yield { chunk: getHelpReply(role, venueState), isCached: false, isErrorFallback: false, isLocal: true };
    return;
  }

  // 3. Resolve quick-action chips locally — instant, no API
  const recs = getRecommendations(venueState, userProfile);
  const localText = role === 'organizer'
    ? resolveLocalOrganizer(normalized, venueState)
    : resolveLocalAttendee(normalized, recs, venueState, userProfile);

  if (localText) {
    geminiMetrics.recordCall(0, true, false);
    yield { chunk: sanitizeGeminiOutput(localText), isCached: false, isErrorFallback: false, isLocal: true };
    return;
  }

  // 4. No valid API key
  if (!hasValidKey || !model) {
    yield {
      chunk: `⚠️ No Gemini API key configured.\n\nAdd your key to the **.env** file:\n\`VITE_GEMINI_API_KEY=your_key_here\`\n\nGet a free key at aistudio.google.com, then restart the dev server.`,
      isCached: false,
      isErrorFallback: true,
    };
    return;
  }

  // 5. Check cache
  const msgHash  = simpleHash(normalized);
  const section  = userProfile?.seatSection || 'none';
  const cacheKey = `${role}:${venueState.eventPhase}:${section}:${msgHash}`;

  const cached = getCachedResponse(cacheKey);
  if (cached) {
    geminiMetrics.recordCall(0, true, false);
    yield { chunk: cached, isCached: true, isErrorFallback: false };
    return;
  }

  // 6. Rate limit check
  if (!rateLimiter.isAllowed()) {
    const fallback = localText || 'Rate limit reached. Please wait a moment and try again.';
    yield { chunk: sanitizeGeminiOutput(fallback), isCached: false, isErrorFallback: true };
    return;
  }

  // 7. Queue API calls
  if (pendingRequest) {
    try { await pendingRequest; } catch (_) { /* ignore inner error */ }
  }

  // 8. Call Gemini with Streaming
  const systemPrompt = role === 'organizer' ? organizerSystemInstruction : attendeeSystemInstruction;
  const contextData  = role === 'organizer'
    ? buildOrganizerContext(venueState)
    : buildAttendeeContext(venueState, userProfile);

  const fullPrompt = `${systemPrompt}\n\n${contextData}\n\nUser: ${sanitized}`;
  const startTime  = Date.now();

  try {
    const result = await model.generateContentStream(fullPrompt);
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      yield { chunk: sanitizeGeminiOutput(chunkText), isCached: false, isErrorFallback: false };
    }
    setCache(cacheKey, sanitizeGeminiOutput(fullText));
    geminiMetrics.recordCall(Date.now() - startTime, false, false);
  } catch (error) {
    console.error('Gemini streaming error:', error);
    geminiMetrics.recordCall(Date.now() - startTime, false, true);
    const msg = error?.message || '';
    const errorText = msg.includes('429') || msg.includes('quota')
      ? '⚠️ Gemini rate limit reached. Please wait a moment and try again.'
      : msg.includes('API_KEY') || msg.includes('403')
      ? '⚠️ Invalid Gemini API key. Check your VITE_GEMINI_API_KEY in the .env file.'
      : msg.includes('404')
      ? '⚠️ Model not available. The Gemini API may be temporarily unavailable.'
      : `⚠️ AI assistant temporarily unavailable. Please try again.\n\n(${msg})`;
    yield { chunk: sanitizeGeminiOutput(errorText), isCached: false, isErrorFallback: true };
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────
/**
 * Main entry point for AI-assisted responses.
 * Routes through local resolvers first (instant), then cache, then Gemini API.
 *
 * @param {string} promptText - Raw user message
 * @param {string} role - 'attendee' | 'organizer'
 * @param {Object} venueState - Current venue state from VenueContext
 * @param {Object} userProfile - User profile from UserContext
 * @returns {Promise<{ text: string, isCached: boolean, isErrorFallback: boolean, isLocal?: boolean }>}
 */
export const getGeminiResponse = async (promptText, role, venueState, userProfile) => {
  const sanitized  = sanitizeUserInput(promptText);
  const normalized = sanitized.toLowerCase();

  // 1. Handle greetings/filler locally — instant, no API
  if (GREETING_RE.test(sanitized) || FILLER_RE.test(sanitized)) {
    return { text: getCasualReply(role, venueState, userProfile), isCached: false, isErrorFallback: false, isLocal: true };
  }

  // 2. Handle help / "what to do" locally
  if (HELP_RE.test(sanitized)) {
    return { text: getHelpReply(role, venueState), isCached: false, isErrorFallback: false, isLocal: true };
  }

  // 3. Resolve quick-action chips locally — instant, no API
  const recs = getRecommendations(venueState, userProfile);
  const localText = role === 'organizer'
    ? resolveLocalOrganizer(normalized, venueState)
    : resolveLocalAttendee(normalized, recs, venueState, userProfile);

  if (localText) {
    geminiMetrics.recordCall(0, true, false);
    return { text: sanitizeGeminiOutput(localText), isCached: false, isErrorFallback: false, isLocal: true };
  }

  // 4. No valid API key
  if (!hasValidKey) {
    return {
      text: `⚠️ No Gemini API key configured.\n\nAdd your key to the **.env** file:\n\`VITE_GEMINI_API_KEY=your_key_here\`\n\nGet a free key at aistudio.google.com, then restart the dev server.`,
      isCached: false,
      isErrorFallback: true,
    };
  }

  // 5. Check cache
  const msgHash  = simpleHash(normalized);
  const section  = userProfile?.seatSection || 'none';
  const cacheKey = `${role}:${venueState.eventPhase}:${section}:${msgHash}`;

  const cached = getCachedResponse(cacheKey);
  if (cached) {
    geminiMetrics.recordCall(0, true, false);
    return { text: cached, isCached: true, isErrorFallback: false };
  }

  // 6. Rate limit check
  if (!rateLimiter.isAllowed()) {
    const fallback = localText || 'Rate limit reached. Please wait a moment and try again.';
    return { text: sanitizeGeminiOutput(fallback), isCached: false, isErrorFallback: true };
  }

  // 7. Queue API calls
  if (pendingRequest) {
    try { await pendingRequest; } catch (_) { /* ignore inner error */ }
  }

  // 8. Call Gemini
  const systemPrompt = role === 'organizer' ? organizerSystemInstruction : attendeeSystemInstruction;
  const contextData  = role === 'organizer'
    ? buildOrganizerContext(venueState)
    : buildAttendeeContext(venueState, userProfile);

  const fullPrompt = `${systemPrompt}\n\n${contextData}\n\nUser: ${sanitized}`;
  const startTime  = Date.now();

  pendingRequest = (async () => {
    try {
      const result       = await model.generateContent(fullPrompt);
      const responseText = sanitizeGeminiOutput(result.response.text());
      setCache(cacheKey, responseText);
      geminiMetrics.recordCall(Date.now() - startTime, false, false);
      return { text: responseText, isCached: false, isErrorFallback: false };
    } catch (error) {
      console.error('Gemini API Error:', error);
      geminiMetrics.recordCall(Date.now() - startTime, false, true);
      const msg = error?.message || '';
      const errorText = msg.includes('429') || msg.includes('quota')
        ? '⚠️ Gemini rate limit reached. Please wait a moment and try again.'
        : msg.includes('API_KEY') || msg.includes('403')
        ? '⚠️ Invalid Gemini API key. Check your VITE_GEMINI_API_KEY in the .env file.'
        : msg.includes('404')
        ? '⚠️ Model not available. The Gemini API may be temporarily unavailable.'
        : `⚠️ AI assistant temporarily unavailable. Please try again.\n\n(${msg})`;
      return { text: sanitizeGeminiOutput(errorText), isCached: false, isErrorFallback: true };
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
};
