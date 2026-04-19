import React, { useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { PageProgressBar } from './components/effects/PageProgressBar';
import { VenueProvider } from './contexts/VenueContext';
import { UserProvider } from './contexts/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import { useUser } from './contexts/UserContext';

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

/* Cinematic transition variants — no CSS filter; filter breaks position:fixed children */
const cinematicVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
};
const instantVariants = {
  initial: {}, animate: {}, exit: {},
};

/**
 * ProtectedRoute — redirects to /select-role if role or onboarding requirements
 * are not met. Renders children otherwise.
 *
 * @param {{ children: React.ReactNode, requiredRole: string|null, requireOnboarding: boolean }} props
 */
function ProtectedRoute({ children, requiredRole, requireOnboarding }) {
  const { userProfile } = useUser();

  if (requiredRole && userProfile.role !== requiredRole) {
    return <Navigate to="/select-role" replace />;
  }

  if (requireOnboarding && !userProfile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children:         PropTypes.node.isRequired,
  requiredRole:     PropTypes.string,
  requireOnboarding: PropTypes.bool,
};
ProtectedRoute.defaultProps = {
  requiredRole:     null,
  requireOnboarding: false,
};

/* Inner component so useLocation works inside BrowserRouter */
function AnimatedRoutes() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? instantVariants : cinematicVariants;

  return (
    <>
      <PageProgressBar />

      {/* Skip-to-content — first focusable element on every page */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          id="main-content"
        >
          <Routes location={location}>
            {/* Public / Landing */}
            <Route path="/" element={
              <ErrorBoundary>
                <Landing />
              </ErrorBoundary>
            } />
            <Route path="/select-role" element={
              <ErrorBoundary>
                <SelectRole />
              </ErrorBoundary>
            } />

            {/* Attendee App */}
            <Route element={<AttendeeLayout />}>
              <Route path="/onboarding" element={
                <ErrorBoundary>
                  <Onboarding />
                </ErrorBoundary>
              } />
              <Route path="/dashboard" element={
                <ErrorBoundary>
                  <ProtectedRoute requireOnboarding>
                    <Dashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="/navigate" element={
                <ErrorBoundary>
                  <ProtectedRoute requireOnboarding>
                    <NavigateView />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="/facilities" element={
                <ErrorBoundary>
                  <ProtectedRoute requireOnboarding>
                    <FacilitiesView />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
              <Route path="/exit" element={
                <ErrorBoundary>
                  <ProtectedRoute requireOnboarding>
                    <ExitGuidance />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
            </Route>

            {/* Organizer App */}
            <Route element={<OrganizerLayout />}>
              <Route path="/organizer" element={
                <ErrorBoundary>
                  <ProtectedRoute requiredRole="organizer">
                    <Organizer />
                  </ProtectedRoute>
                </ErrorBoundary>
              } />
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
