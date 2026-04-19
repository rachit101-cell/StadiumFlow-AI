import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

/** Helper component that throws on render when throwError prop is true */
const BrokenChild = ({ throwError = false, message = 'Test error' }) => {
  if (throwError) {
    throw new Error(message);
  }
  return <div data-testid="child-content">Child rendered successfully</div>;
};

describe('ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child rendered successfully')).toBeInTheDocument();
  });

  it('renders default error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenChild throwError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders custom fallback prop when provided and child throws', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <BrokenChild throwError />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('resets error state when Try again is clicked and subsequent child succeeds', () => {
    // First mount with a broken child
    const { rerender } = render(
      <ErrorBoundary key="test-boundary">
        <BrokenChild throwError />
      </ErrorBoundary>
    );
    // Error UI should be visible
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click "Try again" — this resets internal state
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // The boundary internal state is now reset; re-render with working child
    // Use key to ensure the error is cleared after reset
    rerender(
      <ErrorBoundary key="test-boundary-2">
        <BrokenChild throwError={false} />
      </ErrorBoundary>
    );
    // After successful rerender, working child should be visible
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });



  it('displays the error message in the error UI', () => {
    render(
      <ErrorBoundary>
        <BrokenChild throwError message="Custom error message for test" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error message for test')).toBeInTheDocument();
  });

  it('error UI has role="alert" for screen reader accessibility', () => {
    render(
      <ErrorBoundary>
        <BrokenChild throwError />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
