# StadiumFlow AI

> **AI-powered matchday navigation.** Real-time crowd routing, gate intelligence, and personalized guidance for stadium attendees — powered by Google Gemini 1.5 Flash.

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

**Live Demo:** [https://stadiumflow-ai-icvapxu2vq-uc.a.run.app](https://stadiumflow-ai-icvapxu2vq-uc.a.run.app)

---

## Overview

StadiumFlow AI is a production-grade React 19 application that eliminates matchday friction using real-time crowd simulation and AI-assisted decision making. The platform serves two audiences simultaneously: **attendees** receive personalized navigation guidance, and **organizers** receive operational intelligence to manage crowd flow.

### Key Features

| Feature | Description |
|---|---|
| 💎 **Command Center UX** | Premium interface featuring Vanta.js 3D backgrounds, multi-layered glassmorphism, cinematic page transitions, and 3D card tilt effects |
| 🚪 **Smart Gate Routing** | Weighted scoring algorithm recommends the optimal entry gate based on live congestion, ETA, and seat proximity |
| 🗺️ **Live Crowd Map** | SVG venue map with real-time congestion overlays, animated ripple alerts, and zone breathe animations |
| 🤖 **AI Chat Assistant** | Streaming Gemini 1.5 Flash integration with full context injection, prompt injection protection, and 45-second LRU cache |
| 📊 **Phase Simulation** | Four-phase match lifecycle (Pre-Match → Live → Half-Time → Post-Match) with realistic crowd behavior modeling |
| ♿ **WCAG 2.1 AA** | Skip navigation, full keyboard support, ARIA live regions, focus-visible rings, high-contrast mode, reduced-motion |
| 🔐 **Security Hardened** | CSP headers, DOMPurify sanitization, rate limiting, input/output sanitization, HSTS via nginx |
| 📱 **Responsive** | Mobile-first layout, Tailwind CSS, Glass morphism design system |

---

## Google Services Used

### Google Gemini 1.5 Flash

Gemini 1.5 Flash is the core intelligence engine of StadiumFlow AI:

- **Context-aware responses** — Each chat query is injected with live venue state: gate congestion, food stall wait times, washroom queues, exit crowd levels, and user profile (seat section, accessibility mode, food preference).
- **Streaming responses** — `model.generateContentStream()` yields token chunks in real time, rendered character-by-character to the chat UI using an async generator pattern.
- **Dual-role system prompts** — Separate system instructions for attendees (warm, personalized) vs. organizers (direct, operational).
- **Prompt injection protection** — All user input is sanitized before inclusion in prompts: strips `system:`, `assistant:`, `user:` prefixes, angle brackets, curly braces, and `ignore * instructions` patterns.
- **Output sanitization** — DOMPurify strips unexpected HTML from all AI responses before DOM rendering.
- **LRU cache** — Identical queries (same role + phase + message hash) resolve from a 45-second in-memory cache without API calls.
- **Rate limiting** — Maximum 10 calls per 60-second rolling window. Graceful fallback message on limit exceeded.
- **Safety settings** — `BLOCK_MEDIUM_AND_ABOVE` for Harassment, Hate Speech, Sexually Explicit, and Dangerous Content categories.

### Google Cloud Run

Deployed as a containerized static app with nginx:

- **Zero-config scaling** — Cloud Run autoscales to zero between events, eliminating idle costs.
- **Health check endpoint** — `/health` returns `200 StadiumFlow AI — healthy` for Cloud Run readiness probes.
- **Security headers** — Content-Security-Policy, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy served by nginx on every request.
- **Static asset caching** — Content-hashed JS/CSS assets cached for 1 year with `Cache-Control: public, immutable`. HTML served with `no-cache, no-store`.
- **Gzip compression** — Level 6 gzip enabled for all text assets; 1 KB minimum threshold.

### Google Material Symbols

Material Symbols Rounded provides the icon system throughout the UI, loaded via Google Fonts CDN with `display=swap` for performance.

### Google Fonts

Three typefaces served from Google Fonts CDN:
- **Space Grotesk** — Display headings, metric values
- **Inter** — Body text, labels, navigation
- **JetBrains Mono** — Code, metric values, timestamps

---

## Architecture

```
StadiumFlow AI
├── src/
│   ├── constants/
│   │   └── venue.js          ← All magic values: PHASES, CONGESTION, GATES, GEMINI config, WEIGHTS
│   ├── contexts/
│   │   ├── VenueContext.jsx   ← Global venue state, fully memoized
│   │   └── UserContext.jsx    ← User profile, fully memoized
│   ├── hooks/
│   │   └── useSimulation.js  ← Phase-based simulation engine with pure exported functions
│   ├── services/
│   │   └── gemini.js         ← Gemini 1.5 Flash: streaming, caching, rate limiting, sanitization
│   ├── utils/
│   │   └── recommendationEngine.js ← Weighted scoring for gates, food, washrooms, exits
│   ├── components/
│   │   ├── ErrorBoundary.jsx ← Class component with reset, fallback prop, role=alert
│   │   └── ui/               ← Design system: Button, Card, CongestionMeter, StatusBadge, ...
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── GateView.jsx
│   │   ├── FacilitiesView.jsx
│   │   ├── ExitGuidance.jsx
│   │   └── OrganizerView.jsx
│   └── test/
│       └── setup.js          ← Vitest global setup with all browser API mocks
├── nginx.conf                ← Production nginx with CSP, HSTS, gzip, health endpoint
├── Dockerfile                ← Multi-stage build: node build + nginx serve
└── vite.config.js            ← Manual chunks, terser minification, coverage thresholds
```

---

## Recommendation Engine

The recommendation engine in `src/utils/recommendationEngine.js` uses a weighted scoring system:

### Gate Scoring
```
score = (100 − congestion) × 1.0  +  proximity_bonus × 0.8
```
- Accessibility mode filters non-accessible gates from the candidate pool
- Alternate gate is the second-highest scorer

### Food Stall Scoring
```
score = (100 − crowdLevel)  −  waitTime × 3  +  distance_bonus × 5
```
- Food preference filter (`veg`, `non-veg`, `any`) applied before scoring
- Falls back to `any` if no matching stalls exist

### Washroom Scoring
```
score = (100 − crowdLevel) × 1  −  waitTime × 4  +  distance_bonus × 4
```
- Wheelchair mode filters non-accessible washrooms

### Exit Scoring
```
score = (100 − crowdLevel) × 1  −  etaMinutes × 6  +  parking_bonus × 15 (family mode)
```

---

## Security

| Layer | Implementation |
|---|---|
| **Input sanitization** | `sanitizeUserInput()` strips injection patterns, angle brackets, curly braces, prompt keywords, truncates to 500 chars |
| **Output sanitization** | `sanitizeGeminiOutput()` runs DOMPurify with `ALLOWED_TAGS: ['b', 'strong', 'em', 'br']` |
| **Rate limiting** | Client-side: 10 calls / 60s rolling window with `rateLimiter.isAllowed()` |
| **API key guard** | Throws at startup if `VITE_GEMINI_API_KEY` is missing or placeholder |
| **Content-Security-Policy** | Strict CSP allowing only approved script/style/font/connect sources |
| **HSTS** | `max-age=31536000; includeSubDomains` enforced via nginx |
| **X-Frame-Options** | `DENY` — prevents clickjacking |
| **X-Content-Type-Options** | `nosniff` — prevents MIME sniffing |
| **Referrer-Policy** | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | Disables geolocation, microphone, camera, payment |

---

## Performance

- **Code splitting** — Vendor chunks: `vendor-react`, `vendor-framer`, `vendor-gemini`, `vendor-three`, `vendor-security`
- **Terser minification** — `drop_console: true`, `passes: 2`, `safari10: true`
- **LRU cache** — 50-entry cap for Gemini responses, 45-second TTL
- **DNS prefetch** — `generativelanguage.googleapis.com` prefetched in `<head>`
- **React.memo** — All UI components wrapped with `memo()`
- **useMemo** — Context values memoized to prevent unnecessary re-renders

---

## Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---|---|
| **Skip navigation** | `<a href="#main-content" class="skip-nav">` visible on keyboard focus |
| **ARIA live regions** | Chat messages: `aria-live="polite"` / `aria-live="assertive"` for alerts |
| **Keyboard navigation** | All interactive elements keyboard-accessible: `Toggle` uses `role="switch"` + Space/Enter |
| **Focus rings** | `:focus-visible` system with 2.5px blue outline, high-contrast yellow overrides |
| **Error states** | `ErrorBoundary` renders with `role="alert"` for screen reader announcement |
| **Progress bars** | `role="progressbar"` + `aria-valuenow/min/max` + `aria-label` on all congestion meters |
| **Status badges** | `role="status"` + `sr-only` text on all `StatusBadge` instances |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` disables all CSS animations universally |
| **High contrast** | `.high-contrast` class swaps entire token system to WCAG-compliant yellows/cyans |
| **Large text** | `.large-text` class increases base font size by 12.5% |

---

## Testing

The project uses **Vitest** with **@testing-library/react** and **jsdom**.

```bash
npm run test:run       # Run all tests once
npm run test:coverage  # Run with coverage report (thresholds: 40%)
npm run test           # Watch mode
npm run test:ui        # Vitest UI
```

### Test Files

| File | Coverage Area | Tests |
|---|---|---|
| `src/utils/__tests__/recommendationEngine.test.js` | Weighted scoring engine | 30+ |
| `src/hooks/__tests__/useSimulation.test.js` | Simulation engine, phase presets | 25+ |
| `src/services/__tests__/gemini.test.js` | Sanitization, caching, metrics, rate limiting | 30+ |
| `src/components/__tests__/CongestionMeter.test.jsx` | ARIA progressbar component | 8 |
| `src/components/__tests__/StatusBadge.test.jsx` | Status component accessibility | 8 |
| `src/components/__tests__/ErrorBoundary.test.jsx` | Error handling + reset | 6 |
| `src/components/__tests__/Button.test.jsx` | Interactive button states | 12 |

---

## Setup

### Prerequisites
- Node.js ≥ 18
- Google Gemini API key ([Get one free at aistudio.google.com](https://aistudio.google.com))

### Local Development

```bash
# Clone
git clone <repo-url>
cd stadiumflow-ai

# Install
npm install

# Configure
cp .env.example .env
# Edit .env and add VITE_GEMINI_API_KEY=your_key_here

# Run
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Docker / Cloud Run

```bash
# Build
docker build -t stadiumflow-ai .

# Run locally
docker run -e VITE_GEMINI_API_KEY=your_key -p 8080:8080 stadiumflow-ai

# Deploy to Cloud Run (via gcloud CLI)
gcloud run deploy stadiumflow-ai \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars VITE_GEMINI_API_KEY=your_key
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | ✅ Yes | Google Gemini API key from aistudio.google.com |

See [`.env.example`](.env.example) for the required format.

---

## License

MIT — Built for the Google Cloud + Gemini Hackathon.
