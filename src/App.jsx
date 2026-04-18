import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PageProgressBar } from './components/effects/PageProgressBar';
import { VenueProvider } from './contexts/VenueContext';
import { UserProvider } from './contexts/UserContext';

// Layouts
import { AttendeeLayout } from './layouts/AttendeeLayout';
import { OrganizerLayout } from './layouts/OrganizerLayout';

// Pages
import { Landing } from './pages/Landing';
import { SelectRole } from './pages/SelectRole';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { NavigateView } from './pages/NavigateView';
import { FacilitiesView } from './pages/FacilitiesView';
import { ExitGuidance } from './pages/ExitGuidance';
import { Organizer } from './pages/Organizer';

/* Cinematic transition variants */
const cinematicVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } },
  exit:    { opacity: 0, y: -8, filter: 'blur(2px)', transition: { duration: 0.18, ease: 'easeIn' } },
};
const instantVariants = {
  initial: {}, animate: {}, exit: {},
};

/* Inner component so useLocation works inside BrowserRouter */
function AnimatedRoutes() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? instantVariants : cinematicVariants;

  return (
    <>
      <PageProgressBar />
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} variants={variants} initial="initial" animate="animate" exit="exit">
          <Routes location={location}>
            {/* Public / Landing */}
            <Route path="/" element={<Landing />} />
            <Route path="/select-role" element={<SelectRole />} />

            {/* Attendee App */}
            <Route element={<AttendeeLayout />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/navigate" element={<NavigateView />} />
              <Route path="/facilities" element={<FacilitiesView />} />
              <Route path="/exit" element={<ExitGuidance />} />
            </Route>

            {/* Organizer App */}
            <Route element={<OrganizerLayout />}>
              <Route path="/organizer" element={<Organizer />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <VenueProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </VenueProvider>
    </UserProvider>
  );
}

export default App;
