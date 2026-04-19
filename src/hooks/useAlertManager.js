import { useCallback, useRef } from 'react';
import { useVenue } from '../contexts/VenueContext';
import { ALERT_TYPES, SEVERITIES, CONGESTION } from '../constants/venue';

/**
 * useAlertManager — manages venue alert generation, deduplication, and dismissal.
 * Wraps the VenueContext dispatch to provide a clean alert API.
 *
 * @returns {{
 *   dispatchAlert: Function,
 *   dismissAlert: Function,
 *   clearStaleAlerts: Function,
 * }}
 */
export function useAlertManager() {
  const { dispatch } = useVenue();
  const seenAlerts = useRef(new Set());

  /**
   * Dispatches a new alert if an identical alert ID is not already active.
   * Automatically deduplicates by alertId.
   *
   * @param {string} alertId - Unique alert identifier (e.g. 'gate-A')
   * @param {string} type - Alert type from ALERT_TYPES
   * @param {string} message - Human-readable alert message
   * @param {'info'|'warning'|'high'|'critical'} severity - Alert severity
   */
  const dispatchAlert = useCallback((alertId, type, message, severity) => {
    if (seenAlerts.current.has(alertId)) return;
    seenAlerts.current.add(alertId);
    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `${alertId}-${Date.now()}`,
        type,
        message,
        severity,
        timestamp: Date.now(),
        dismissible: true,
      },
    });
  }, [dispatch]);

  /**
   * Dismisses an active alert by its ID and removes it from the dedup set.
   * @param {string} alertId - The ID of the alert to dismiss
   */
  const dismissAlert = useCallback((alertId) => {
    seenAlerts.current.delete(alertId);
    dispatch({ type: 'DISMISS_ALERT', payload: alertId });
  }, [dispatch]);

  /**
   * Resets the seen-alerts deduplication set, allowing all alerts to re-trigger.
   * Useful when transitioning between event phases.
   */
  const clearStaleAlerts = useCallback(() => {
    seenAlerts.current.clear();
  }, []);

  return { dispatchAlert, dismissAlert, clearStaleAlerts, ALERT_TYPES, SEVERITIES, CONGESTION };
}
