import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useVenue } from '../contexts/VenueContext';
import { Button, Toggle } from '../components/ui';

const TOTAL_STEPS = 4;

const ProgressBar = ({ step }) => (
  <div className="flex items-center gap-0 mb-10">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
      const done = i < step;
      const active = i === step - 1;
      return (
        <React.Fragment key={i}>
          {/* Circle */}
          <div
            style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              background: done ? 'var(--accent-blue)' : active ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
              border: `2px solid ${done || active ? 'var(--accent-blue)' : 'var(--border-default)'}`,
              transition: 'all 300ms ease',
            }}
          >
            {done ? (
              <span className="material-symbols-rounded" style={{ fontSize: '14px', color: '#fff' }} aria-hidden="true">check</span>
            ) : (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: active ? 'var(--accent-blue-bright)' : 'var(--text-muted)' }}>
                {i + 1}
              </span>
            )}
          </div>
          {/* Connector line */}
          {i < TOTAL_STEPS - 1 && (
            <div
              style={{
                flex: 1,
                height: '2px',
                background: done ? 'var(--accent-blue)' : 'var(--border-default)',
                transition: 'background 300ms ease',
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* Section picker grid card */
const SectionCard = ({ section, selected, onClick }) => (
  <button
    onClick={onClick}
    className="focus-ring"
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 12px',
      borderRadius: '12px',
      border: `2px solid ${selected ? 'var(--accent-blue)' : 'var(--border-default)'}`,
      background: selected ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
      cursor: 'pointer',
      transition: 'all 200ms ease',
      transform: selected ? 'scale(1.02)' : 'scale(1)',
    }}
    aria-pressed={selected}
    aria-label={`Section ${section.id}: ${section.label}`}
  >
    <span
      className="material-symbols-rounded"
      style={{ fontSize: '22px', color: selected ? 'var(--accent-blue-bright)' : 'var(--text-secondary)', marginBottom: '6px' }}
      aria-hidden="true"
    >
      stadium
    </span>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: selected ? 'var(--accent-blue-bright)' : 'var(--text-primary)', lineHeight: 1 }}>
      {section.id}
    </div>
    <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center', lineHeight: 1.3 }}>
      {section.label}
    </div>
  </button>
);

/* Food preference card */
const FoodCard = ({ icon, label, selected, onClick }) => (
  <button
    onClick={onClick}
    className="focus-ring"
    style={{
      padding: '20px',
      borderRadius: 'var(--card-radius-sm)',
      border: `2px solid ${selected ? 'var(--accent-blue)' : 'var(--border-default)'}`,
      background: selected ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      transition: 'all 200ms ease',
      transform: selected ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
      boxShadow: selected ? '0 0 20px rgba(59,130,246,0.15)' : 'none',
    }}
    aria-pressed={selected}
    aria-label={label}
  >
    <span className="material-symbols-rounded" style={{ fontSize: '28px', color: selected ? 'var(--accent-blue-bright)' : 'var(--text-secondary)' }} aria-hidden="true">{icon}</span>
    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: selected ? 'var(--accent-blue-bright)' : 'var(--text-primary)' }}>{label}</span>
  </button>
);

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 36 : -36 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -36 : 36, transition: { duration: 0.18, ease: 'easeIn' } }),
};

export const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const { userProfile, updateProfile } = useUser();
  const { venueState } = useVenue();
  const navigate = useNavigate();

  const go = (delta) => {
    setDirection(delta);
    setStep(s => s + delta);
  };

  const handleComplete = () => {
    updateProfile({ onboardingComplete: true });
    navigate('/dashboard');
  };

  const sectionList = Object.entries(venueState.sections).map(([id, s]) => ({ id, ...s }));

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.07), transparent)' }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Progress */}
        <ProgressBar step={step} />

        {/* Step card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--card-radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            padding: '36px',
            position: 'relative',
          }}
        >
          {/* Top shimmer */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.3) 50%, transparent)',
            }}
            aria-hidden="true"
          />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* ─── Step 1: Seat Section ─── */}
              {step === 1 && (
                <div>
                  <div className="text-center mb-8">
                    <div
                      style={{
                        width: '48px', height: '48px',
                        borderRadius: '14px',
                        background: 'var(--accent-blue-dim)',
                        border: '1px solid var(--border-emphasis)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '26px', color: 'var(--accent-blue-bright)' }} aria-hidden="true">stadium</span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)', marginTop: 0, marginBottom: '6px' }}>
                      Find Your Seat
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      Which section are you in today?
                    </p>
                  </div>

                  {/* Event name chip */}
                  <div
                    className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-full mx-auto"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      maxWidth: 'fit-content',
                    }}
                  >
                    <span className="animate-pulse-live" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-safe)', flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{venueState.eventName}</span>
                  </div>

                  {/* Section grid */}
                  <div className="grid grid-cols-4 gap-2 mb-8">
                    {sectionList.map(section => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        selected={userProfile.seatSection === section.id}
                        onClick={() => updateProfile({ seatSection: section.id })}
                      />
                    ))}
                  </div>

                  <Button onClick={() => go(1)} className="w-full">Continue</Button>
                </div>
              )}

              {/* ─── Step 2: Preferences ─── */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-8">
                    <div
                      style={{
                        width: '48px', height: '48px',
                        borderRadius: '14px',
                        background: 'var(--accent-teal-dim)',
                        border: '1px solid rgba(20,184,166,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '26px', color: 'var(--accent-teal-bright)' }} aria-hidden="true">settings_accessibility</span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)', marginTop: 0, marginBottom: '6px' }}>
                      Preferences
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      We'll personalize your routes based on these.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mb-8">
                    <Toggle
                      checked={userProfile.accessibilityMode}
                      onChange={() => updateProfile({ accessibilityMode: !userProfile.accessibilityMode })}
                      label="Stair-free Routing"
                      description="Routes avoid stairs — suitable for wheelchairs and limited mobility."
                      id="toggle-accessibility"
                    />

                    {/* Sub-option for wheelchair */}
                    <AnimatePresence>
                      {userProfile.accessibilityMode && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden', paddingLeft: '12px' }}
                        >
                          <Toggle
                            checked={userProfile.wheelchairMode}
                            onChange={() => updateProfile({ wheelchairMode: !userProfile.wheelchairMode })}
                            label="Requires Wheelchair Access"
                            description="Only routes through wider, step-free paths."
                            id="toggle-wheelchair"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Toggle
                      checked={userProfile.familyGroupMode}
                      onChange={() => updateProfile({ familyGroupMode: !userProfile.familyGroupMode })}
                      label="Family / Group Mode"
                      description="Routes for groups — wider paths, reduced congestion."
                      id="toggle-family"
                    />

                    {/* Group size selector */}
                    <AnimatePresence>
                      {userProfile.familyGroupMode && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden', paddingLeft: '12px' }}
                        >
                          <div
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-default)',
                              borderRadius: '10px',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                            }}
                          >
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)' }}>Group Size</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateProfile({ groupSize: Math.max(2, (userProfile.groupSize || 2) - 1) })}
                                style={{
                                  width: '28px', height: '28px', borderRadius: '50%',
                                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', color: 'var(--text-secondary)',
                                }}
                                className="focus-ring"
                                aria-label="Decrease group size"
                              >
                                <span className="material-symbols-rounded" style={{ fontSize: '16px' }} aria-hidden="true">remove</span>
                              </button>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '20px', textAlign: 'center' }}>
                                {userProfile.groupSize || 2}
                              </span>
                              <button
                                onClick={() => updateProfile({ groupSize: Math.min(20, (userProfile.groupSize || 2) + 1) })}
                                style={{
                                  width: '28px', height: '28px', borderRadius: '50%',
                                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', color: 'var(--text-secondary)',
                                }}
                                className="focus-ring"
                                aria-label="Increase group size"
                              >
                                <span className="material-symbols-rounded" style={{ fontSize: '16px' }} aria-hidden="true">add</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => go(-1)} className="w-1/3">Back</Button>
                    <Button onClick={() => go(1)} className="w-2/3">Continue</Button>
                  </div>
                </div>
              )}

              {/* ─── Step 3: Food preference ─── */}
              {step === 3 && (
                <div>
                  <div className="text-center mb-8">
                    <div
                      style={{
                        width: '48px', height: '48px',
                        borderRadius: '14px',
                        background: 'var(--status-caution-bg)',
                        border: '1px solid var(--status-caution-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '26px', color: 'var(--status-caution)' }} aria-hidden="true">restaurant</span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)', marginTop: 0, marginBottom: '6px' }}>
                      Food Preference
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      We'll filter food stall suggestions for you.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <FoodCard icon="eco" label="Vegetarian" selected={userProfile.foodPreference === 'veg'} onClick={() => updateProfile({ foodPreference: 'veg' })} />
                    <FoodCard icon="kebab_dining" label="Non-Veg" selected={userProfile.foodPreference === 'non-veg'} onClick={() => updateProfile({ foodPreference: 'non-veg' })} />
                    <FoodCard icon="fastfood" label="No Preference" selected={userProfile.foodPreference === 'any'} onClick={() => updateProfile({ foodPreference: 'any' })} />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => go(-1)} className="w-1/3">Back</Button>
                    <Button onClick={() => go(1)} className="w-2/3">Continue</Button>
                  </div>
                </div>
              )}

              {/* ─── Step 4: Confirmation ─── */}
              {step === 4 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
                    style={{
                      width: '72px', height: '72px',
                      background: 'var(--status-safe-bg)',
                      border: '2px solid var(--status-safe-border)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '36px', color: 'var(--status-safe)' }} aria-hidden="true">check_circle</span>
                  </motion.div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)', marginTop: 0, marginBottom: '24px' }}>
                    You're All Set!
                  </h2>

                  {/* Summary card */}
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--card-radius-sm)',
                      overflow: 'hidden',
                      marginBottom: '20px',
                      textAlign: 'left',
                    }}
                  >
                    {[
                      { label: 'Seat Section', value: venueState.sections[userProfile.seatSection]?.label || userProfile.seatSection },
                      { label: 'Routing Style', value: `${userProfile.accessibilityMode ? 'Stair-free' : 'Standard'}${userProfile.familyGroupMode ? ` · Group of ${userProfile.groupSize}` : ''}` },
                      { label: 'Food Preference', value: { veg: 'Vegetarian', 'non-veg': 'Non-Vegetarian', any: 'No Preference' }[userProfile.foodPreference] || '—' },
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderBottom: i < arr.length - 1 ? '1px solid var(--border-ghost)' : 'none',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>{row.label}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                    You can update these anytime in the sidebar.
                  </p>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => go(-1)} className="w-1/3">Back</Button>
                    <Button onClick={handleComplete} className="w-2/3">Show My Route →</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Gemini credit */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>Powered by Google Gemini</span>
        </div>
      </div>
    </div>
  );
};
