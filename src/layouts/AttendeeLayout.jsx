import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { AlertStrip } from '../components/ui/AlertStrip';
import { ChatAssistant } from '../components/domain/ChatAssistant';
import { useVenue } from '../contexts/VenueContext';

const PHASE_STYLES = {
  'post-match': { text: 'var(--status-danger)',  bg: 'var(--status-danger-bg)',  border: 'var(--status-danger-border)'  },
  'halftime':   { text: 'var(--status-caution)', bg: 'var(--status-caution-bg)', border: 'var(--status-caution-border)' },
  'live-match': { text: 'var(--status-safe)',    bg: 'var(--status-safe-bg)',    border: 'var(--status-safe-border)'    },
  'pre-match':  { text: 'var(--accent-blue-bright)', bg: 'var(--accent-blue-dim)', border: 'var(--border-emphasis)'     },
};

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',  icon: 'home' },
  { path: '/navigate',   label: 'Navigate',   icon: 'map' },
  { path: '/facilities', label: 'Facilities', icon: 'restaurant' },
  { path: '/exit',       label: 'Exit Plan',  icon: 'logout' },
];

/* Hex-shaped logo mark SVG */
const HexLogo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 2L19.66 7V17L11 22L2.34 17V7L11 2Z" stroke="var(--accent-blue)" strokeWidth="1.5" fill="var(--accent-blue-dim)" />
    <path d="M8 11h2m0 0l2-2m-2 2l2 2" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const AttendeeLayout = () => {
  const { userProfile, updateProfile } = useUser();
  const { venueState } = useVenue();
  const location = useLocation();
  const navigate = useNavigate();
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  const noAuthPaths = ['/', '/select-role', '/onboarding'];
  if (!userProfile.onboardingComplete && !noAuthPaths.includes(location.pathname)) {
    return <Navigate to="/onboarding" replace />;
  }

  const phase = venueState.eventPhase;
  const pc = PHASE_STYLES[phase] || PHASE_STYLES['pre-match'];

  /* Toggle high-contrast on the root <html> element */
  const toggleHighContrast = () => {
    setHighContrast(v => {
      const next = !v;
      document.documentElement.classList.toggle('high-contrast', next);
      return next;
    });
  };
  const toggleLargeText = () => {
    setLargeText(v => {
      const next = !v;
      document.documentElement.classList.toggle('large-text', next);
      return next;
    });
  };

  const hasAlerts = venueState.activeAlerts.length > 0;

  return (
    <div
      className={`min-h-screen flex flex-col relative`}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* ── Top App Bar ─────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 glass-layer-3 glass-rim"
        style={{ height: 'var(--topbar-height)' }}
        role="banner"
      >
        {/* Left: Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 focus-ring"
          aria-label="StadiumFlow AI Home"
          style={{ textDecoration: 'none' }}
        >
          <HexLogo />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            StadiumFlow<span style={{ color: 'var(--accent-blue)' }}>AI</span>
          </span>
        </Link>

        {/* Center: Event chip */}
        {userProfile.onboardingComplete && (
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span
              className="animate-pulse-live"
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--status-safe)', flexShrink: 0 }}
              aria-hidden="true"
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              {venueState.eventName}
            </span>
          </div>
        )}

        {/* Right: Controls */}
        {userProfile.onboardingComplete && (
          <div className="flex items-center gap-2">
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
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: pc.text, flexShrink: 0 }} aria-hidden="true" />
              {phase.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>

            {/* High-contrast toggle */}
            <button
              onClick={toggleHighContrast}
              className="focus-ring"
              aria-label={`High contrast mode: ${highContrast ? 'on' : 'off'}`}
              aria-pressed={highContrast}
              style={{
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px',
                background: highContrast ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${highContrast ? 'var(--border-emphasis)' : 'var(--border-default)'}`,
                color: highContrast ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">
                {highContrast ? 'visibility' : 'visibility_off'}
              </span>
            </button>

            {/* Alerts bell */}
            <button
              className="relative focus-ring"
              style={{
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-emphasis)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              aria-label={`Alerts (${venueState.activeAlerts.length})`}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">notifications</span>
              {hasAlerts && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px', right: '-3px',
                    width: '16px', height: '16px',
                    borderRadius: '50%',
                    background: 'var(--status-danger)',
                    border: '2px solid var(--bg-base)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, color: '#fff',
                  }}
                  aria-hidden="true"
                >
                  {venueState.activeAlerts.length}
                </span>
              )}
            </button>

            {/* Switch role */}
            <button
              onClick={() => navigate('/select-role')}
              className="hidden md:block focus-ring"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              aria-label="Switch role"
            >
              Switch Role
            </button>

            {/* User avatar */}
            <button
              className="focus-ring"
              style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
              }}
              aria-label={`User: ${userProfile.name || 'Guest'}`}
            >
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'G'}
            </button>
          </div>
        )}
      </header>

      {/* ── Alert Strip (always shown, always has content) ── */}
      {userProfile.onboardingComplete && (
        <div
          className="fixed left-0 right-0 z-40"
          style={{ top: 'var(--topbar-height)' }}
        >
          <AlertStrip />
        </div>
      )}

      {/* ── Main Layout ── */}
      <div
        className="flex flex-1"
        style={{ paddingTop: `calc(var(--topbar-height) + ${userProfile.onboardingComplete ? '40px' : '0px'})` }}
      >
        {/* Sidebar Nav (desktop) */}
        {userProfile.onboardingComplete && (
          <nav
            className="hidden md:flex flex-col gap-1 fixed left-0 z-30 px-3 py-4"
            style={{
              top: `calc(var(--topbar-height) + 40px)`,
              bottom: 0,
              width: 'var(--sidebar-width)',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-subtle)',
            }}
            role="navigation"
            aria-label="Main navigation"
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-widest)',
                color: 'var(--text-muted)',
                padding: '8px 12px',
              }}
            >
              Navigation
            </span>

            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] transition-all duration-150 focus-ring ${isActive ? 'nav-item-active' : ''}`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                    textDecoration: 'none',
                    paddingLeft: isActive ? '10px' : '12px',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: '18px' }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}

            {/* Bottom section */}
            <div
              className="mt-auto mx-0 pt-3"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              {/* Stair-free toggle */}
              <button
                onClick={() => updateProfile({ accessibilityMode: !userProfile.accessibilityMode })}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] transition-all focus-ring"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: userProfile.accessibilityMode ? 'var(--accent-teal-bright)' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                aria-pressed={userProfile.accessibilityMode}
                aria-label={`Stair-free routing: ${userProfile.accessibilityMode ? 'on' : 'off'}`}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">accessible</span>
                Stair-free
                <div
                  className="ml-auto"
                  style={{
                    width: '28px', height: '16px',
                    borderRadius: '8px',
                    background: userProfile.accessibilityMode ? 'var(--accent-teal)' : 'var(--border-default)',
                    display: 'flex', alignItems: 'center', padding: '2px',
                    transition: 'background 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '12px', height: '12px',
                      borderRadius: '50%',
                      background: '#fff',
                      transform: userProfile.accessibilityMode ? 'translateX(12px)' : 'translateX(0)',
                      transition: 'transform 200ms ease',
                    }}
                  />
                </div>
              </button>

              {/* Large text toggle */}
              <button
                onClick={toggleLargeText}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] transition-all focus-ring"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: largeText ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                aria-pressed={largeText}
                aria-label={`Large text: ${largeText ? 'on' : 'off'}`}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">text_increase</span>
                Large Text
                <div
                  className="ml-auto"
                  style={{
                    width: '28px', height: '16px',
                    borderRadius: '8px',
                    background: largeText ? 'var(--accent-blue)' : 'var(--border-default)',
                    display: 'flex', alignItems: 'center', padding: '2px',
                    transition: 'background 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '12px', height: '12px',
                      borderRadius: '50%',
                      background: '#fff',
                      transform: largeText ? 'translateX(12px)' : 'translateX(0)',
                      transition: 'transform 200ms ease',
                    }}
                  />
                </div>
              </button>

              {/* Gemini credit */}
              <div
                className="flex items-center gap-1.5 mt-3 px-3 py-2"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  Powered by Google Gemini
                </span>
              </div>

              {/* User profile row */}
              <div
                className="flex items-center gap-2 mt-1 mx-0 px-3 py-2 rounded-[10px]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userProfile.name || 'Guest'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)' }}>
                    Attendee · Section {userProfile.seatSection}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Main content */}
        <main
          className={`flex-1 ${userProfile.onboardingComplete ? 'md:pl-[248px]' : ''}`}
          id="main-content"
        >
          <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '24px 16px 96px', }} className="md:px-6 md:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      {userProfile.onboardingComplete && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
          style={{
            background: 'rgba(8,12,20,0.95)',
            borderTop: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(20px)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            height: '64px',
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors focus-ring"
                style={{
                  color: isActive ? 'var(--accent-blue-bright)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '22px' }} aria-hidden="true">{item.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Chat assistant */}
      {userProfile.onboardingComplete && <ChatAssistant />}

      {/* Demo Controls (hidden by default, hover to reveal) */}
      <div
        className="fixed bottom-0 left-0 z-50 group"
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          padding: '4px',
          borderTopRightRadius: '8px',
          border: '1px solid transparent',
          transition: 'all 200ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
      >
        <span className="group-hover:hidden opacity-40" style={{ fontFamily: 'var(--font-body)' }}>Demo</span>
        <div className="hidden group-hover:flex gap-3 px-2 py-1">
          {['pre-match', 'live-match', 'halftime', 'post-match'].map(p => (
            <button
              key={p}
              onClick={() => window.dispatchEvent(new CustomEvent('demo-event', { detail: p }))}
              style={{
                fontFamily: 'var(--font-body)', fontSize: '11px',
                color: 'var(--text-secondary)', background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 4px', borderRadius: '4px',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-blue)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {p.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
