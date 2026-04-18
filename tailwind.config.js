/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Background depth system */
        bg: {
          void:     '#050709',
          base:     '#080C14',
          surface:  '#0C1220',
          card:     '#101828',
          elevated: '#141E30',
          overlay:  '#192338',
          hover:    '#1E2A40',
          active:   '#243148',
        },
        /* Accent — Electric Blue */
        'accent-blue': {
          DEFAULT: '#3B82F6',
          dim:    'rgba(59,130,246,0.08)',
          subtle: 'rgba(59,130,246,0.15)',
          muted:  '#1D4ED8',
          bright: '#60A5FA',
          vivid:  '#93C5FD',
        },
        /* Accent — Teal */
        'accent-teal': {
          DEFAULT: '#14B8A6',
          dim:    'rgba(20,184,166,0.08)',
          subtle: 'rgba(20,184,166,0.15)',
          bright: '#2DD4BF',
          vivid:  '#5EEAD4',
        },
        /* Status */
        status: {
          safe:     '#10B981',
          'safe-bg':   'rgba(16,185,129,0.08)',
          caution:  '#F59E0B',
          'caution-bg':'rgba(245,158,11,0.08)',
          warning:  '#F97316',
          'warning-bg':'rgba(249,115,22,0.08)',
          danger:   '#EF4444',
          'danger-bg': 'rgba(239,68,68,0.08)',
          /* Legacy aliases */
          low:      '#10B981',
          medium:   '#F59E0B',
          high:     '#F97316',
          critical: '#EF4444',
        },
        /* Text */
        text: {
          primary:   '#F8FAFC',
          secondary: '#94A3B8',
          tertiary:  '#64748B',
          muted:     '#475569',
          disabled:  '#334155',
          inverse:   '#080C14',
          accent:    '#60A5FA',
          teal:      '#2DD4BF',
        },
        /* Border */
        border: {
          ghost:    'rgba(255,255,255,0.03)',
          subtle:   'rgba(255,255,255,0.06)',
          default:  'rgba(255,255,255,0.09)',
          emphasis: 'rgba(59,130,246,0.25)',
          active:   'rgba(59,130,246,0.5)',
          glow:     'rgba(59,130,246,0.8)',
        },
        /* Legacy backward compat */
        base: {
          DEFAULT:     '#080C14',
          surface:     '#0C1220',
          card:        '#101828',
          elevated:    '#141E30',
          overlay:     '#192338',
          border:      'rgba(255,255,255,0.09)',
          borderActive:'rgba(59,130,246,0.5)',
          borderSubtle:'rgba(255,255,255,0.06)',
        },
        accent: {
          blue:       '#3B82F6',
          blueBright: '#60A5FA',
          blueGlow:   'rgba(59,130,246,0.15)',
          teal:       '#14B8A6',
          tealBright: '#2DD4BF',
          tealGlow:   'rgba(20,184,166,0.12)',
          primary:    '#3B82F6',
          secondary:  '#14B8A6',
          warning:    '#F59E0B',
          success:    '#10B981',
        },
        background: {
          base:     '#080C14',
          surface:  '#0C1220',
          card:     '#101828',
          elevated: '#141E30',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card:    '16px',
        'card-lg':'20px',
        'card-sm':'10px',
        chip:    '24px',
      },
      fontSize: {
        hero:   ['clamp(40px,6vw,72px)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        h1:     ['28px',  { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2:     ['22px',  { lineHeight: '1.3',  letterSpacing: '-0.01em' }],
        h3:     ['18px',  { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
        body:   ['14px',  { lineHeight: '1.65' }],
        caption:['12px',  { lineHeight: '1.5'  }],
        micro:  ['11px',  { lineHeight: '1.4'  }],
        nano:   ['10px',  { lineHeight: '1.4'  }],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-live': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.5)', opacity: '0.6' },
        },
        draw: {
          to: { strokeDashoffset: '0' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'skeleton-sweep': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer:         'shimmer 2s infinite linear',
        'pulse-live':    'pulse-live 1.5s ease-in-out infinite',
        draw:            'draw 1s cubic-bezier(0.4,0,0.2,1) forwards',
        'slide-up':      'slide-up 0.25s ease-out',
        'fade-in':       'fade-in 0.2s ease-out',
        'skeleton-sweep':'skeleton-sweep 1.8s ease infinite',
        pulse:           'pulse-live 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}
