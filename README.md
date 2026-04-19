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
- **Premium dark UI** — Glassmorphism cards, animated heatmaps, micro-interactions
- **High-contrast mode** — WCAG 2.1 AA compliant; togglable in navigation and onboarding
- **Large text mode** — Scales all typography proportionally without breaking layouts
- **Keyboard navigable** — Every interactive element is Tab-reachable with visible focus rings
- **Reduced-motion support** — All animations respect `prefers-reduced-motion`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 + custom CSS tokens |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Icons | Google Material Symbols (Rounded) |
| Fonts | Inter, Space Grotesk (Google Fonts) |
| Animation | Framer Motion + CSS keyframes |
| State | React Context API + useReducer |
| Routing | React Router v6 |
| Map | Custom hand-built SVG — no Leaflet, no Google Maps |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env   # or create .env manually (see below)

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

The API key is accessed exclusively through `src/services/gemini.js` — it is never referenced directly in any component.

---

## Project Structure

```
src/
├── components/
│   ├── domain/         # Feature-specific components (ChatAssistant, StadiumMap, etc.)
│   └── ui/             # Shared design system components (Button, Card, Badge, etc.)
├── contexts/
│   ├── VenueContext.jsx # Global venue state (gates, corridors, alerts, phases)
│   └── UserContext.jsx  # User profile (seat, accessibility, preferences)
├── hooks/
│   ├── useSimulation.js # Simulation engine (phase timer, noise, spike events)
│   └── use3DTilt.js     # 3D card tilt interaction hook
├── layouts/
│   ├── AttendeeLayout.jsx
│   └── OrganizerLayout.jsx
├── pages/
│   ├── Landing.jsx
│   ├── SelectRole.jsx
│   ├── Onboarding.jsx
│   ├── Dashboard.jsx
│   ├── NavigateView.jsx
│   ├── FacilitiesView.jsx
│   ├── ExitGuidance.jsx
│   └── Organizer.jsx
├── services/
│   └── gemini.js        # All Gemini API calls centralized here
└── utils/
    └── recommendationEngine.js  # Pure function: computes personalized recommendations
```

---

## Routes

| Path | Page |
|---|---|
| `/` | Marketing landing page |
| `/select-role` | Role selection (Attendee / Organizer) |
| `/onboarding` | 4-step attendee onboarding |
| `/dashboard` | Attendee matchday dashboard |
| `/navigate` | Stadium SVG map + route panel |
| `/facilities` | Food stalls & washrooms assistant |
| `/exit` | Exit guidance (post-match) |
| `/organizer` | Organizer control center |

---

## Demo Controls

A **Demo Mode** panel is available in the bottom-right corner (click the lab flask icon in the footer or press `Ctrl+Shift+D`). It lets you:

- Jump to any event phase instantly
- Trigger individual simulation scenarios (Gate Rush, Halftime Rush, etc.)
- Run a fully scripted **Auto Demo** sequence (ideal for live presentations)
- Reset everything back to pre-match baseline

---

## Powered By

- [Google Gemini API](https://ai.google.dev/) — AI intelligence layer
- [Google Fonts](https://fonts.google.com/) — Inter, Space Grotesk
- [Google Material Symbols](https://fonts.google.com/icons) — Icon system
