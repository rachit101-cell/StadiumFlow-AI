import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVenue } from '../../contexts/VenueContext';
import { useUser } from '../../contexts/UserContext';
import { getGeminiResponse, streamGeminiResponse } from '../../services/gemini';
import { useMagneticEffect } from '../../hooks/useMagneticEffect';
import { AIBadge, QuickActionChip } from '../ui';

/* ─── Response parsers (unchanged logic) ─── */
const parseAttendeeResponse = (text) => {
  const parts = { recommendation: '', why: '', impact: '', backup: '', raw: text };
  if (!text) return parts;
  const recMatch   = text.match(/\*\*Recommendation:\*\*?([^\n]+)/i);
  const whyMatch   = text.match(/\*\*Why:\*\*?([^\n]+)/i);
  const impactMatch = text.match(/\*\*Time Impact:\*\*?([^\n]+)/i);
  const backMatch  = text.match(/\*\*Backup Option:\*\*?([^\n]+)/i);
  if (recMatch || whyMatch) {
    parts.recommendation = recMatch  ? recMatch[1].trim()   : '';
    parts.why            = whyMatch  ? whyMatch[1].trim()   : '';
    parts.impact         = impactMatch ? impactMatch[1].trim() : '';
    parts.backup         = backMatch ? backMatch[1].trim()  : '';
    parts.structured     = true;
  }
  return parts;
};

const parseOrganizerResponse = (text) => {
  const parts = { urgency: '', zone: '', action: '', reason: '', advisory: '', raw: text };
  if (!text) return parts;
  const uggMatch = text.match(/\*\*Urgency:\*\*?([^\n]+)/i);
  const zonMatch = text.match(/\*\*Zone:\*\*?([^\n]+)/i);
  const actMatch = text.match(/\*\*Recommended Action:\*\*?([^\n]+)/i);
  const rsnMatch = text.match(/\*\*Reason:\*\*?([^\n]+)/i);
  const advMatch = text.match(/\*\*Suggested Advisory(?: for Attendees)?:\*\*?([^\n]+)/i);
  if (uggMatch || actMatch) {
    parts.urgency  = uggMatch ? uggMatch[1].trim() : '';
    parts.zone     = zonMatch ? zonMatch[1].trim() : '';
    parts.action   = actMatch ? actMatch[1].trim() : '';
    parts.reason   = rsnMatch ? rsnMatch[1].trim() : '';
    parts.advisory = advMatch ? advMatch[1].trim() : '';
    parts.structured = true;
  }
  return parts;
};

/* ─── Structured AI response card ─── */
const ResponseRow = ({ label, content, accentColor, prefix }) => (
  <div
    style={{
      padding: '10px 14px',
      borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
      borderBottom: '1px solid var(--border-ghost)',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        color: 'var(--text-muted)',
        marginBottom: '3px',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        fontWeight: 500,
        color: accentColor === 'var(--accent-teal)' ? 'var(--accent-teal-bright)' : accentColor ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
        lineHeight: 1.5,
      }}
    >
      {prefix && <span style={{ marginRight: '4px', opacity: 0.7 }}>{prefix}</span>}
      {content}
    </div>
  </div>
);

const AttendeeMessageCard = ({ parts }) => {
  if (!parts.structured) {
    return (
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, padding: '10px 14px' }}>
        {parts.raw}
      </p>
    );
  }
  return (
    <div style={{ overflow: 'hidden' }}>
      <ResponseRow label="Recommendation" content={parts.recommendation} accentColor="var(--accent-blue)" />
      <ResponseRow label="Why" content={parts.why} />
      {parts.impact && (
        <ResponseRow
          label="Time Impact"
          content={parts.impact}
          accentColor="var(--accent-teal)"
          prefix="⏱"
        />
      )}
      {parts.backup && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', marginBottom: '3px' }}>
            Backup Option
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            → {parts.backup}
          </div>
        </div>
      )}
    </div>
  );
};

const OrganizerMessageCard = ({ parts }) => {
  if (!parts.structured) {
    return (
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, padding: '10px 14px' }}>
        {parts.raw}
      </p>
    );
  }
  const urgColor = parts.urgency?.toLowerCase().includes('critical')
    ? { bg: 'var(--status-danger-bg)', text: 'var(--status-danger)', border: 'var(--status-danger-border)' }
    : parts.urgency?.toLowerCase().includes('high')
    ? { bg: 'var(--status-warning-bg)', text: 'var(--status-warning)', border: 'var(--status-warning-border)' }
    : { bg: 'var(--accent-blue-dim)', text: 'var(--accent-blue-bright)', border: 'var(--border-emphasis)' };
  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-ghost)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              background: urgColor.bg, color: urgColor.text, border: `1px solid ${urgColor.border}`,
              borderRadius: '4px', padding: '2px 6px',
              fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)',
            }}
          >
            {parts.urgency || 'Medium'}
          </span>
          {parts.zone && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {parts.zone}
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', marginBottom: '3px' }}>Action</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{parts.action}</div>
      </div>
      <ResponseRow label="Reason" content={parts.reason} />
      {parts.advisory && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-muted)', marginBottom: '3px' }}>Suggested Broadcast</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.5 }}>"{parts.advisory}"</div>
        </div>
      )}
    </div>
  );
};

/* ─── Typing indicator ─── */
const TypingIndicator = () => (
  <div
    style={{
      alignSelf: 'flex-start',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '4px 16px 16px 16px',
      padding: '14px 18px',
    }}
  >
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="typing-dot"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--text-muted)',
          }}
          aria-hidden="true"
        />
      ))}
    </div>
    <span className="sr-only">AI is typing…</span>
  </div>
);

/* ─── Main component ─── */
export const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { venueState } = useVenue();
  const { userProfile } = useUser();
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const dockBtnRef = useRef(null);
  const isOrganizer = userProfile.role === 'organizer';

  /* Magnetic dock effect */
  const { ref: dockRef, magneticStyle, glowOpacity } = useMagneticEffect(80);

  const attendeeChips = [
    'Best gate for me', 'Route to my seat', 'Nearest washroom',
    'Best food now', 'Should I leave now?', 'Best exit after match',
    'Is there congestion?',
  ];
  const organizerChips = [
    'Highest risk zone now', 'Where to deploy staff?', 'Which exit needs support?',
    'Should I open another counter?', 'What advisory to send?',
  ];
  const activeChips = isOrganizer ? organizerChips : attendeeChips;

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Focus trap: when panel opens, focus input */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /* Keyboard trap inside panel */
  const handlePanelKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      dockBtnRef.current?.focus();
    }
    if (e.key === 'Tab') {
      const focusable = panelRef.current?.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }, []);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    const userMessageId = Date.now();
    const assistantMessageId = userMessageId + 1;

    setMessages(prev => [...prev, { id: userMessageId, role: 'user', text }]);
    setInputText('');
    setIsTyping(true);

    // Add empty assistant message placeholder for streaming
    setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', text: '', isCached: false, isErrorFallback: false, isStreaming: true }]);

    try {
      let isFirstChunk = true;
      for await (const chunkData of streamGeminiResponse(text, userProfile.role, venueState, userProfile)) {
        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
        }
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMessageId) {
             // Handle structured string updates by appending to existing text
             return {
               ...m,
               text: m.text + chunkData.chunk,
               isCached: chunkData.isCached || false,
               isErrorFallback: chunkData.isErrorFallback || false,
             };
          }
          return m;
        }));
      }
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => prev.map(m => {
        if (m.id === assistantMessageId) {
          return {
            ...m,
            text: 'Communication array unavailable. Please check the dashboard manually or locate a staff member.',
            isErrorFallback: true,
          };
        }
        return m;
      }));
    } finally {
      setIsTyping(false);
      setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, isStreaming: false } : m));
    }
  };

  const modeLabel = isOrganizer ? 'ORGANIZER' : 'ATTENDEE';
  const contextLine = `Section ${userProfile.seatSection || '—'} · ${(venueState.eventPhase || '').replace('-', ' ')} · Gate A: ${venueState.gates?.A?.congestion ?? '—'}%`;

  return (
    <>
      {/* Dock Button */}
      <button
        ref={(el) => { dockRef.current = el; dockBtnRef.current = el; }}
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-7 right-7 z-40 flex items-center justify-center text-white focus-ring"
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-expanded={isOpen}
        style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))',
          borderRadius: '18px',
          boxShadow: `0 4px 24px rgba(59,130,246,${glowOpacity}), 0 1px 4px rgba(0,0,0,0.4)`,
          transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 250ms ease',
          cursor: 'pointer',
          border: 'none',
          ...magneticStyle,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: '24px' }} aria-hidden="true">
          auto_awesome
        </span>
        {/* Notification dot */}
        {!isOpen && venueState.activeAlerts?.length > 0 && (
          <span
            className="animate-pulse-live"
            style={{
              position: 'absolute',
              top: '-2px', right: '-2px',
              width: '10px', height: '10px',
              borderRadius: '50%',
              background: 'var(--status-danger)',
              border: '2px solid var(--bg-base)',
            }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onKeyDown={handlePanelKeyDown}
            className="fixed z-50 flex flex-col"
            style={{
              width: '384px',
              maxWidth: '100vw',
              right: '16px',
              top: '74px',
              bottom: '20px',
              background: 'rgba(20,30,48,0.80)',
              backdropFilter: 'blur(32px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            role="dialog"
            aria-label="AI Assistant"
            aria-modal="true"
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px', height: '32px',
                      background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '18px', color: '#fff' }} aria-hidden="true">
                      auto_awesome
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        AI Assistant
                      </span>
                      <AIBadge />
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--accent-blue-bright)', marginTop: '1px' }}>
                      {modeLabel}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setIsOpen(false); dockBtnRef.current?.focus(); }}
                  className="focus-ring"
                  style={{
                    width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    transition: 'color 150ms, background 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  aria-label="Close AI Assistant"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">close</span>
                </button>
              </div>

              {/* Gemini attribution */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <span
                  className="animate-pulse-live"
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-safe)', flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Powered by Google Gemini · Live venue context active
                </span>
              </div>
            </div>

            {/* Messages */}
            <div
              className="scrollbar-hide"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Welcome state */}
              {messages.length === 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    gap: '12px',
                    textAlign: 'center',
                    padding: '24px 16px',
                  }}
                >
                  <div
                    style={{
                      width: '48px', height: '48px',
                      background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-teal))',
                      borderRadius: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '26px', color: '#fff' }} aria-hidden="true">auto_awesome</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: 'var(--tracking-snug)' }}>
                      Hi {userProfile.name || 'there'}. I know your venue.
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {contextLine}
                    </p>
                  </div>
                  {/* Quick chips in 2-col grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '8px' }}>
                    {activeChips.map(chip => (
                      <button
                        key={chip}
                        onClick={() => handleSend(chip)}
                        className="focus-ring"
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          lineHeight: 1.4,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-teal-dim)'; e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.color = 'var(--accent-teal-bright)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message list */}
              {messages.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  {m.role === 'assistant' && (
                    <div
                      style={{
                        width: '24px', height: '24px',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(20,184,166,0.2))',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginBottom: '4px',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '13px', color: 'var(--accent-blue)' }} aria-hidden="true">auto_awesome</span>
                    </div>
                  )}
                  <div style={{ maxWidth: m.role === 'user' ? '78%' : '94%', position: 'relative' }}>
                    {m.role === 'user' ? (
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          color: '#ffffff',
                          background: 'linear-gradient(135deg, var(--accent-blue-muted), var(--accent-blue))',
                          borderRadius: '16px 16px 4px 16px',
                          padding: '10px 14px',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                        }}
                      >
                        {m.text}
                      </div>
                    ) : (
                      <div
                        className={m.isStreaming ? "ai-glow" : ""}
                        style={{
                          background: m.isErrorFallback ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
                          border: m.isErrorFallback ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--border-subtle)',
                          borderRadius: '4px 16px 16px 16px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {/* Error fallback — plain warning message */}
                        {m.isErrorFallback ? (
                          <div style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--status-warning)', flexShrink: 0, marginTop: '1px' }} aria-hidden="true">warning</span>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                              {m.text}
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* AI badge top-right — only for real AI responses */}
                            <div style={{ position: 'absolute', top: '8px', right: '10px', zIndex: 1 }}>
                              <AIBadge />
                            </div>
                            {isOrganizer
                              ? <OrganizerMessageCard parts={parseOrganizerResponse(m.text)} />
                              : <AttendeeMessageCard parts={parseAttendeeResponse(m.text)} />
                            }
                          </>
                        )}
                        {m.isCached && !m.isErrorFallback && (
                          <div style={{ padding: '4px 14px 8px', fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)' }}>
                            ⚡ Cached response
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips */}
            {messages.length > 0 && (
              <div
                className="scrollbar-hide"
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-ghost)',
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  flexShrink: 0,
                }}
              >
                {activeChips.slice(0, 5).map(chip => (
                  <QuickActionChip key={chip} label={chip} onClick={() => handleSend(chip)} />
                ))}
              </div>
            )}

            {/* Input Row */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(inputText); }
                }}
                placeholder="Ask StadiumFlow AI…"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  outline: 'none',
                  transition: 'border-color 200ms, box-shadow 200ms',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--accent-blue)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border-default)';
                  e.target.style.boxShadow = 'none';
                }}
                aria-label="Type a message to the AI assistant"
              />
              <button
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim() || isTyping}
                className="focus-ring"
                style={{
                  width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-blue), #2563EB)',
                  border: '1px solid rgba(96,165,250,0.3)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  cursor: !inputText.trim() || isTyping ? 'not-allowed' : 'pointer',
                  opacity: !inputText.trim() || isTyping ? 0.5 : 1,
                  transition: 'all 200ms ease',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(59,130,246,0.3)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                aria-label="Send message"
              >
                <span className="material-symbols-rounded" style={{ fontSize: '18px' }} aria-hidden="true">send</span>
              </button>
            </div>

            {/* Gemini credit */}
            <div
              style={{
                padding: '8px 16px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)' }}>
                Powered by Google Gemini
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
