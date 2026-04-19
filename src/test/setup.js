// Global test setup for Vitest + jsdom
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// ── DOMPurify mock (no real DOM operations needed in unit tests) ──────────────
vi.mock('dompurify', () => ({
  default: {
    sanitize:    (input) => input,
    isSupported: true,
  },
}));

// ── Google Generative AI mock ─────────────────────────────────────────────────
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class GoogleGenerativeAI {
    constructor() {}
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () =>
              '**Recommendation:** Use Gate C — lowest congestion\n' +
              '**Why:** Gate C has 38% congestion, 36 points below Gate A\n' +
              '**Time Impact:** Saves approximately 6 minutes entry time\n' +
              '**Backup Option:** Gate E at 50% congestion is the next best option',
          },
        }),
        generateContentStream: vi.fn().mockResolvedValue({
          stream: (async function* () {
            yield { text: () => '**Recommendation:** Use Gate C\n' };
            yield { text: () => '**Why:** Low congestion\n' };
            yield { text: () => '**Time Impact:** 4 min\n' };
            yield { text: () => '**Backup Option:** Gate E' };
          })(),
        }),
      };
    }
  },
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT:        'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH:       'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));


// ── Vanta.js + Three.js mock (CDN scripts, not installed modules) ─────────────
Object.defineProperty(globalThis, 'VANTA', {
  value: {
    NET: vi.fn().mockReturnValue({
      destroy: vi.fn(),
      pause:   vi.fn(),
      play:    vi.fn(),
    }),
  },
  writable: true,
});
Object.defineProperty(globalThis, 'THREE', {
  value:    { WebGLRenderer: vi.fn(), Scene: vi.fn() },
  writable: true,
});

// ── matchMedia mock (jsdom does not implement matchMedia) ─────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         vi.fn(),
    removeListener:      vi.fn(),
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:       vi.fn(),
  })),
});

// ── IntersectionObserver mock ─────────────────────────────────────────────────
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe:    vi.fn(),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
}));

// ── ResizeObserver mock ───────────────────────────────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe:    vi.fn(),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
}));

// ── Suppress console.error for expected React warnings in tests ───────────────
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning:')) return;
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

afterEach(() => {
  vi.clearAllTimers();
});
