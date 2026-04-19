import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary — class-based React error boundary.
 * Catches JavaScript errors in any child component tree,
 * logs them, and displays a fallback UI instead of crashing the entire app.
 *
 * @example
 * <ErrorBoundary fallback={<p>Custom error UI</p>}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  /**
   * Updates state so the next render shows the fallback UI.
   * @param {Error} error - The error that was thrown
   * @returns {{ hasError: boolean, error: Error }}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Logs the error details for debugging.
   * @param {Error} error - The thrown error
   * @param {React.ErrorInfo} errorInfo - Component stack info
   */
  componentDidCatch(error, errorInfo) {
    console.error('StadiumFlow Error Boundary caught:', error, errorInfo);
  }

  /** Resets the error state to allow recovery. */
  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--card-radius)',
            color: 'var(--text-primary)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: '0 0 8px' }}>
            Something went wrong
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              margin: '0 0 16px',
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: 'var(--accent-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--card-radius-sm)',
              padding: '8px 16px',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  /** The component tree to protect */
  children: PropTypes.node.isRequired,
  /** Optional custom fallback UI — if omitted, default error card is shown */
  fallback: PropTypes.node,
};

ErrorBoundary.defaultProps = {
  fallback: null,
};

export default ErrorBoundary;
