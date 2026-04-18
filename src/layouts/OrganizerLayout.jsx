import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useVenue } from '../contexts/VenueContext';
import { ChatAssistant } from '../components/domain/ChatAssistant';

const PHASE_STYLES = {
  'post-match': { text: 'var(--status-danger)',  bg: 'var(--status-danger-bg)',  border: 'var(--status-danger-border)'  },
  'halftime':   { text: 'var(--status-caution)', bg: 'var(--status-caution-bg)', border: 'var(--status-caution-border)' },
  'live-match': { text: 'var(--status-safe)',    bg: 'var(--status-safe-bg)',    border: 'var(--status-safe-border)'    },
  'pre-match':  { text: 'var(--accent-blue-bright)', bg: 'var(--accent-blue-dim)', border: 'var(--border-emphasis)' },
};

export const OrganizerLayout = () => {
  const { userProfile } = useUser();
  const { venueState } = useVenue();
  const navigate = useNavigate();

  if (userProfile.role !== 'organizer') {
    return <Navigate to="/select-role" replace />;
  }

  const pc = PHASE_STYLES[venueState.eventPhase] || PHASE_STYLES['pre-match'];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* ── Ops App Bar ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 glass-layer-3 glass-rim"
        style={{ height: 'var(--topbar-height)' }}
        role="banner"
      >
        <div className="flex items-center gap-4">
          {/* Logo — Amber hex for organizer mode */}
          <div
            className="flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M11 2L19.66 7V17L11 22L2.34 17V7L11 2Z" stroke="var(--status-caution)" strokeWidth="1.5" fill="var(--status-caution-bg)" />
              <path d="M7 11h8M11 7v8" stroke="var(--status-caution)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>
              StadiumFlow
              <span style={{ color: 'var(--status-caution)' }}> Ops</span>
            </span>
          </div>

          {/* Divider */}
          <div
            className="hidden md:block h-5 w-px"
            style={{ background: 'var(--border-subtle)' }}
            aria-hidden="true"
          />

          {/* Event name */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
          >
            <span
              className="animate-pulse-live"
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: pc.text, flexShrink: 0 }}
              aria-hidden="true"
            />
            {venueState.eventName} ·{' '}
            <span style={{ color: pc.text }}>
              {venueState.eventPhase.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Phase badge */}
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background: pc.bg,
              border: `1px solid ${pc.border}`,
              color: pc.text,
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-widest)',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: pc.text }} aria-hidden="true" />
            {venueState.eventPhase.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>

          {/* Switch to attendee */}
          <button
            onClick={() => navigate('/select-role')}
            className="focus-ring"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: '7px 14px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-emphasis)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
          >
            Attendee View
          </button>

          {/* Ops avatar badge */}
          <div
            style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: 'var(--status-caution)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--bg-base)',
            }}
            aria-label="Organizer account"
          >
            OP
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main
        className="flex-1 w-full mx-auto px-4 md:px-8 py-6 pb-24"
        id="main-content"
        style={{ maxWidth: '1600px' }}
      >
        <Outlet />
      </main>

      {/* Gemini credit footer */}
      <div
        className="flex items-center justify-center gap-1.5 py-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <span
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }}
          aria-hidden="true"
        />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)' }}>
          Powered by Google Gemini
        </span>
      </div>

      <ChatAssistant />
    </div>
  );
};
