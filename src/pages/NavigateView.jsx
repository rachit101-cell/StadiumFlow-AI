import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useVenue } from '../contexts/VenueContext';
import { StadiumMap } from '../components/domain/StadiumMap';
import { getRecommendations } from '../utils/recommendationEngine';
import { Card, StatusBadge, Button, CongestionMeter } from '../components/ui';

export const NavigateView = () => {
    const { userProfile, updateProfile } = useUser();
    const { venueState } = useVenue();
    const [destType, setDestType] = useState('Seat'); // Seat, Food, Washroom, Exit
    
    // Map Zoom State
    const [zoom, setZoom] = useState(1);
    
    // Mock Route Navigation State
    const [navActive, setNavActive] = useState(false);

    const recsRaw = getRecommendations(venueState, userProfile);
    // Inject the origin section so the map can compute accurate start-to-end routes
    const recs = { ...recsRaw, _originSection: userProfile.seatSection || 'E' };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
    const handleResetZoom = () => setZoom(1);

    const handleNavClick = () => {
        setNavActive(!navActive);
    }

    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)] gap-4">
           
           {/* Detailed Routing Panel */}
           <div className="w-full md:w-[35%] flex flex-col gap-4">
              <h1 className="font-display font-semibold" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>Venue Navigation</h1>
              
              {/* Destination Selector Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 {['Seat', 'Food', 'Washroom', 'Exit'].map(t => (
                    <button 
                       key={t}
                       onClick={() => { setDestType(t); setNavActive(false); }}
                       className="flex-shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.04em] px-3.5 py-1.5 rounded-full transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                       style={destType === t
                         ? { background: 'rgba(59,130,246,0.15)', border: '1px solid #3B82F6', color: '#60A5FA' }
                         : { background: '#161F2E', border: '1px solid #1E2D45', color: '#94A3B8' }
                       }
                       aria-pressed={destType === t}
                    >
                       {t}
                    </button>
                 ))}
              </div>

              {/* Dynamic Detail Card Based on Dest */}
              <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1E2D45', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                 
                 {destType === 'Seat' && (
                    <div className="flex flex-col h-full">
                       <StatusBadge status="low" label="Optimal Entry Route" className="mb-4 self-start" />
                       <h2 className="text-xl font-bold mb-1">To Section {userProfile.seatSection}</h2>
                       <p className="text-text-secondary text-sm mb-6">Via Gate {recs.bestGate.id}</p>

                       <div className="bg-background-elevated rounded-xl p-4 border border-border-subtle mb-6">
                          <div className="text-sm font-semibold mb-3">Turn-by-turn</div>
                          <div className="flex flex-col gap-4 relative">
                              <div className="absolute left-3.5 top-2 bottom-4 w-px bg-border-active -z-10"></div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">1</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Enter Gate {recs.bestGate.id}</span></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-border-active flex items-center justify-center font-bold text-xs">2</div>
                                 <div><span className="text-text-primary text-sm font-medium">Take the Inner Corridor</span><p className="text-xs text-text-muted mt-0.5">Crowd Level: {venueState.corridors.innerNorth.congestion}%</p></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">3</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Arrive at Section {userProfile.seatSection}</span></div>
                              </div>
                          </div>
                          {venueState.corridors.innerNorth.congestion > 65 && (
                             <div className="mt-6 flex items-center gap-2 text-xs font-medium text-accent-warning bg-accent-warning/10 p-2 rounded">
                                <span className="material-symbols-rounded text-[14px]">warning</span>
                                Warning: Inner Corridor is highly congested. Follow staff directions.
                             </div>
                          )}
                       </div>

                       <div className="flex items-center justify-between mt-auto bg-background-base p-3 rounded-xl border border-border-subtle">
                           <span className="text-sm font-medium flex items-center gap-2">
                             <span className="material-symbols-rounded text-text-muted">timer</span> Total ETA: <span className="text-white font-bold">{recs.bestRoute.etaMinutes} min</span>
                           </span>
                       </div>
                    </div>
                 )}

                 {destType === 'Food' && (
                     <div className="flex flex-col h-full">
                       <StatusBadge status="medium" label="Nearest Uncongested Food" className="mb-4 self-start" />
                       <h2 className="text-xl font-bold mb-1">{recs.bestFood.name}</h2>
                       <p className="text-text-secondary text-sm mb-6">Found near {recs.bestFood.near}</p>
                       <div className="bg-background-elevated rounded-xl p-4 border border-border-subtle text-sm mb-4">
                           {recs.bestFood.reason}
                       </div>
                       
                       <div className="bg-background-elevated rounded-xl p-4 border border-border-subtle mb-6">
                          <div className="text-sm font-semibold mb-3">Turn-by-turn</div>
                          <div className="flex flex-col gap-4 relative">
                              <div className="absolute left-3.5 top-2 bottom-4 w-px bg-border-active -z-10"></div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">1</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Leave Section {userProfile.seatSection}</span></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-border-active flex items-center justify-center font-bold text-xs">2</div>
                                 <div><span className="text-text-primary text-sm font-medium">Take the Inner Corridor</span><p className="text-xs text-text-muted mt-0.5">Crowd Level: {venueState.corridors.innerNorth.congestion}%</p></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">3</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Arrive at {recs.bestFood.name}</span></div>
                              </div>
                          </div>
                           {venueState.corridors.innerNorth.congestion > 65 && (
                              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-accent-warning bg-accent-warning/10 p-2 rounded">
                                 <span className="material-symbols-rounded text-[14px]">warning</span>
                                 Warning: Inner Corridor is highly congested. Follow staff directions.
                              </div>
                           )}
                       </div>

                       <Button 
                          className={`mt-auto transition-colors ${navActive ? '!bg-[#FF3B55] !border-[#FF3B55]' : ''}`} 
                          onClick={handleNavClick}
                       >
                          {navActive ? 'Cancel Active Navigation' : 'Begin Route Navigation'}
                       </Button>
                     </div>
                 )}

                 {destType === 'Washroom' && (
                     <div className="flex flex-col h-full">
                       <StatusBadge status="low" label="Nearest Uncongested Washroom" className="mb-4 self-start" />
                       <h2 className="text-xl font-bold mb-1">{recs.bestWashroom.label}</h2>
                       <p className="text-text-secondary text-sm mb-6">Found near {recs.bestWashroom.near}</p>
                       <div className="bg-background-elevated rounded-xl p-4 border border-border-subtle text-sm mb-4">
                           {recs.bestWashroom.reason}
                       </div>
                       
                       <div className="bg-background-elevated rounded-xl p-4 border border-border-subtle mb-6">
                          <div className="text-sm font-semibold mb-3">Turn-by-turn</div>
                          <div className="flex flex-col gap-4 relative">
                              <div className="absolute left-3.5 top-2 bottom-4 w-px bg-border-active -z-10"></div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">1</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Leave Section {userProfile.seatSection}</span></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-border-active flex items-center justify-center font-bold text-xs">2</div>
                                 <div><span className="text-text-primary text-sm font-medium">Take the Inner Corridor</span><p className="text-xs text-text-muted mt-0.5">Crowd Level: {venueState.corridors.innerNorth.congestion}%</p></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">3</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Arrive at {recs.bestWashroom.label}</span></div>
                              </div>
                          </div>
                       </div>

                       <Button 
                          className={`mt-auto transition-colors ${navActive ? '!bg-[#FF3B55] !border-[#FF3B55]' : ''}`} 
                          onClick={handleNavClick}
                       >
                          {navActive ? 'Cancel Active Navigation' : 'Begin Route Navigation'}
                       </Button>
                     </div>
                 )}

                 {destType === 'Exit' && (
                     <div className="flex flex-col h-full">
                       <StatusBadge status={recs.bestExit.crowdLevel > 70 ? 'high' : 'low'} label="Target Exit Route" className="mb-4 self-start" />
                       <h2 className="text-xl font-bold mb-1">{recs.bestExit.label}</h2>
                       <p className="text-text-secondary text-sm mb-6">Estimated walk time: {recs.bestExit.etaMinutes} mins</p>
                       <div className="bg-background-elevated rounded-xl p-4 border border-border-subtle text-sm mb-4">
                           {recs.bestExit.reason}
                       </div>
                       
                       <div className="bg-background-elevated rounded-xl p-4 border border-border-subtle mb-6">
                          <div className="text-sm font-semibold mb-3">Turn-by-turn</div>
                          <div className="flex flex-col gap-4 relative">
                              <div className="absolute left-3.5 top-2 bottom-4 w-px bg-border-active -z-10"></div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">1</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Leave Section {userProfile.seatSection}</span></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-border-active flex items-center justify-center font-bold text-xs">2</div>
                                 <div><span className="text-text-primary text-sm font-medium">Head towards optimal gate</span><p className="text-xs text-text-muted mt-0.5">Crowd Level: {venueState.corridors.innerNorth.congestion}%</p></div>
                              </div>
                              <div className="flex gap-3">
                                 <div className="w-7 h-7 rounded-full bg-background-base border-2 border-accent-primary flex items-center justify-center font-bold text-xs">3</div>
                                 <div className="pt-1"><span className="text-text-primary text-sm font-medium">Proceed to {recs.bestExit.label}</span></div>
                              </div>
                          </div>
                           {venueState.corridors.innerNorth.congestion > 65 && (
                              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-accent-warning bg-accent-warning/10 p-2 rounded">
                                 <span className="material-symbols-rounded text-[14px]">warning</span>
                                 Warning: High volume detected near exits. Please do not run.
                              </div>
                           )}
                       </div>

                       <Button 
                          variant={navActive ? 'danger' : 'primary'}
                          className="w-full mt-auto" 
                          onClick={handleNavClick}
                       >
                          {navActive ? 'Cancel Active Navigation' : 'Begin Route Navigation'}
                       </Button>
                     </div>
                 )}
              </div>

              {/* Accessbility Toggle Inline */}
              <div className="bg-background-card p-3 rounded-xl border border-border-subtle flex justify-between items-center cursor-pointer mb-20 md:mb-0" onClick={() => updateProfile({ accessibilityMode: !userProfile.accessibilityMode })}>
                 <div className="text-sm font-medium flex items-center gap-2"><span className="material-symbols-rounded text-accent-primary">accessible</span> Stair-free Routing</div>
                 <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${userProfile.accessibilityMode ? 'bg-accent-primary' : 'bg-border-subtle'}`}>
                     <div className={`w-4 h-4 bg-white rounded-full transition-transform ${userProfile.accessibilityMode ? 'translate-x-4' : ''}`}></div>
                 </div>
              </div>
           </div>

           {/* ── The Map ── */}
           <div className="w-full md:w-[65%] min-h-[480px] rounded-3xl overflow-hidden relative"
             style={{ background: '#080B12', border: '1px solid #1E2D45', boxShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>
              
              {/* Route breadcrumb banner */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full flex items-center gap-2"
                style={{ background: 'rgba(13,17,23,0.9)', border: '1px solid #1E2D45', backdropFilter: 'blur(12px)' }}>
                 <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">Route</span>
                 <span className="font-sans text-[12px] font-medium" style={{ color: destType === 'Exit' ? '#2DD4BF' : destType === 'Food' ? '#F59E0B' : '#60A5FA' }}>
                    Section {userProfile.seatSection || 'E'}
                    {' '}<span className="text-text-muted">→</span>{' '}
                    {destType === 'Seat'     && `Gate ${recs.bestGate?.id} → Your Seat`}
                    {destType === 'Food'     && recs.bestFood?.name}
                    {destType === 'Washroom' && recs.bestWashroom?.label}
                    {destType === 'Exit'     && recs.bestExit?.label}
                 </span>
                 <span className="w-1.5 h-1.5 rounded-full animate-pulse-live" style={{ background: destType === 'Exit' ? '#14B8A6' : '#3B82F6' }} />
              </div>

              <div 
                 className="w-full h-full transition-transform duration-300 ease-out origin-center"
                 style={{ transform: `scale(${zoom})` }}
              >
                 <StadiumMap routeCategory={destType} recs={recs} />
              </div>

              {/* Zoom Controls */}
              <div className="absolute top-12 left-3 flex flex-col p-1 gap-0.5 rounded-xl"
                style={{ background: 'rgba(22,31,46,0.92)', border: '1px solid #1E2D45', backdropFilter: 'blur(12px)' }}>
                 <button onClick={handleZoomIn}
                   className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-text-secondary hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                   aria-label="Zoom in">
                   <span className="material-symbols-rounded text-[16px]" aria-hidden="true">add</span>
                 </button>
                 <button onClick={handleZoomOut}
                   className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-text-secondary hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                   aria-label="Zoom out">
                   <span className="material-symbols-rounded text-[16px]" aria-hidden="true">remove</span>
                 </button>
                 <div className="h-px mx-1" style={{ background: '#1E2D45' }} />
                 <button onClick={handleResetZoom}
                   className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-text-secondary hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                   aria-label="Reset zoom">
                   <span className="material-symbols-rounded text-[16px]" aria-hidden="true">my_location</span>
                 </button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 p-3 rounded-xl pointer-events-none"
                style={{ background: 'rgba(13,17,23,0.88)', border: '1px solid #1E2D45', backdropFilter: 'blur(10px)' }}>
                 <div className="font-sans text-[9px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-2">Congestion</div>
                 {[
                   { color: '#10B981', label: 'Low (0–40%)' },
                   { color: '#F59E0B', label: 'Medium (41–65%)' },
                   { color: '#F97316', label: 'High (66–80%)' },
                   { color: '#EF4444', label: 'Critical (81%+)' },
                 ].map(l => (
                   <div key={l.label} className="flex items-center gap-2 mb-1">
                     <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color, opacity: 0.85 }} aria-hidden="true" />
                     <span className="font-sans text-[10px] text-text-muted">{l.label}</span>
                   </div>
                 ))}
                 <div className="mt-2 pt-2 flex items-center gap-2" style={{ borderTop: '1px solid #1E2D45' }}>
                   <div className="w-6 h-0.5 rounded" style={{ background: '#3B82F6' }} aria-hidden="true" />
                   <span className="font-sans text-[10px] text-text-muted">Active Route</span>
                 </div>
              </div>
           </div>

        </div>
    );
};
