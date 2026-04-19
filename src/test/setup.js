// Global test setup for Vitest + jsdom
import '@testing-library/jest-dom';

// ── DOMPurify mock (no real DOM operations needed in unit tests) ──────────────
vi.mock('dompurify', () => ({
  default: {
    sanitize:    (input) => input,
    isSupported: true,
  },
}));

// ── Google Generative AI mock ─────────────────────────────────────────────────
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent:       vi.fn().mockResolvedValue({ response: { text: () => 'Mock Gemini response' } }),
        generateContentStream: vi.fn().mockResolvedValue({ stream: (async function* () { yield { text: () => 'chunk' }; })() }),
      };
    }
  },
  HarmCategory:        { HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT', HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH', HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT' },
  HarmBlockThreshold:  { BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE' },
}));

// ── Vanta.js + Three.js mock (CDN scripts, not installed modules) ─────────────
Object.defineProperty(globalThis, 'VANTA', {
  value:    { NET: vi.fn().mockReturnValue({ destroy: vi.fn() }) },
  writable: true,
});
Object.defineProperty(globalThis, 'THREE', {
  value:    { WebGLRenderer: vi.fn(), Scene: vi.fn() },
  writable: true,
});

// ── matchMedia mock (jsdom does not implement matchMedia) ─────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value:    (query) => ({
    matches:              false,
    media:                query,
    onchange:             null,
    addListener:          vi.fn(),
    removeListener:       vi.fn(),
    addEventListener:     vi.fn(),
    removeEventListener:  vi.fn(),
    dispatchEvent:        vi.fn(),
  }),
});

// ── IntersectionObserver mock ─────────────────────────────────────────────────
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(cb) { this.cb = cb; }
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// ── ResizeObserver mock ───────────────────────────────────────────────────────
globalThis.ResizeObserver = class ResizeObserver {
  constructor(cb) { this.cb = cb; }
  observe()    {}
  unobserve()  {}
  disconnect() {}
};
