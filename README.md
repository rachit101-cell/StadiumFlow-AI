# StadiumFlow AI 🏟️

An AI-powered matchday coordination platform that makes large sporting venues smarter — from the moment an attendee arrives to the moment they exit after the match.

Built for the **Google Gemini hackathon**, StadiumFlow AI gives attendees real-time gate guidance, crowd-aware routing, and personalized facility recommendations, while providing venue organizers with an operational command center powered by live simulation and AI-generated insights.

---

## Features

### Attendee Experience
- **Smart Gate Assignment** — Recommends the least-congested gate based on your seat section and live crowd data
- **Live Route Navigation** — Custom SVG stadium map with animated route paths, heatmap overlays, and stair-free accessible routing
- **Wait-Time Intelligence** — Real-time food stall and washroom queue rankings with sparkline trend charts
- **AI Chatbot** — Powered by Google Gemini 1.5 Flash; responds with structured, context-aware matchday advice
- **Personalized Alerts** — Phase-aware push alerts based on event state (pre-match, halftime, post-match)
- **Exit Guidance** — Post-match exit recommendations with "Leave Now vs. Wait" logic and alternate exit suggestions

### Organizer Control Center
- **Zone Health Dashboard** — Live congestion scores for all gates, corridors, and facilities
- **AI Recommendation Feed** — Gemini-generated operational directives with one-click approve & broadcast
- **Advisory Composer** — Send advisories from the organizer panel that appear as banners in the attendee view
- **Scenario Simulation** — Trigger real-time simulation events: Gate Rush, Halftime Food Rush, Corridor Spike, Exit Surge

### Design & Accessibility
- **WCAG 2.1 AA Compliant** — High-contrast mode togglable globally, readable sans-serif typography, and distinct focus rings (`:focus-visible`).
- **Semantic HTML & ARIA** — Full screen-reader support via `aria-live` alert regions, `progressbar` roles, and `.sr-only` context tags.
- **Motion Safety** — Strict adherence to `prefers-reduced-motion` safety nets. Disables all Three.js, Vanta, and Framer Motion animations when active.
- **Large Text Mode** — Scales UI proportionally for low-vision users.

---

## Technical Excellence

### Security Posture
- **Input Sanitization**: All AI-generated output is processed through DOMPurify with strict HTML tag whitelisting before any rendering.
- **GCP Secrets Management**: API keys strictly managed via `.env` files that are tightly scoped and ignored by version control.
- **Nginx Security Headers**: Production infrastructure enforces strict Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, and nosniff policies.
- **Gemini Guardrails**: Safety settings explicitly set to `BLOCK_MEDIUM_AND_ABOVE` for harassment, hate speech, and sexually explicit content.

### Testing & Validation
- **Unit Testing**: Comprehensive Vitest suite testing the recommendation engine's pure functions and the simulation's deterministic state updates.
- **Mocking Strategy**: Full integration of `vi.mock` for external dependencies (GoogleGenerativeAI, DOMPurify, Three.js) to ensure perfectly isolated testing environments.
- **Coverage**: Scripts included for `npm run test:run` and `npm run test:coverage` to ensure code stability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Build & Infra | Docker + Nginx + Cloud Run |
| Styling | Tailwind CSS v3 + custom CSS tokens |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Testing | Vitest + React Testing Library |
| Icons | Google Material Symbols (Rounded) |
| Fonts | Inter, Space Grotesk (Google Fonts) |
| Map | Custom hand-built SVG — no Leaflet, no Google Maps |

---

## Getting Started

### Prerequisites
- Node.js 18+ or Docker
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation (Local)

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env   # Add your Gemini API key

# Start development server
npm run dev

# Run test suite
npm run test:run
```

### Deployment (Docker / Cloud Run)

```bash
# Build the production image multi-stage Dockerfile
docker build -t stadiumflow-ai .

# Run the container (injects PORT automatically)
docker run -p 8080:8080 -e PORT=8080 -e VITE_GEMINI_API_KEY=your_key stadiumflow-ai
```

---

## Project Structure

```
src/
├── components/
│   ├── domain/         # Feature-specific components (ChatAssistant, StadiumMap, etc.)
│   ├── ui/             # Shared design system (Button, Card, CongestionMeter, etc.)
│   └── __tests__/      # Component-level tests
├── contexts/           # Global states (VenueContext, UserContext)
├── hooks/
│   ├── useSimulation.js # Simulation engine (phase timer, noise, spike events)
│   └── __tests__/      # State transition unit tests
├── services/
│   └── gemini.js        # LRU cached, Rate-limited Gemini API integration
├── utils/
│   └── recommendationEngine.js  # Pure functions for personalized suggestions
└── test/
    └── setup.js        # Vitest global definitions and mocks
```

---

## Powered By

- [Google Cloud Run](https://cloud.google.com/run) — Serverless container hosting
- [Google Gemini API](https://ai.google.dev/) — Stateful match intelligence
- [Vanta.js](https://www.vantajs.com/) — Interactive 3D background elements
