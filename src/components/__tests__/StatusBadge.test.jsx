import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/ui';

describe('StatusBadge', () => {
  it('renders with default props (status=low)', () => {
    render(<StatusBadge status="low" />);
    // sr-only text is rendered
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });

  it('renders the displayLabel when label prop is provided', () => {
    render(<StatusBadge status="high" label="High Traffic" />);
    expect(screen.getByText('High Traffic')).toBeInTheDocument();
  });

  it('falls back to c.label when label prop is omitted', () => {
    render(<StatusBadge status="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders screen-reader text with status description', () => {
    render(<StatusBadge status="danger" />);
    const srText = document.querySelector('.sr-only');
    expect(srText?.textContent).toContain('Danger');
  });

  it('renders icon when icon prop is provided', () => {
    render(<StatusBadge status="warning" icon="alert" />);
    // Material symbol icon span should be present
    const iconEl = document.querySelector('.material-symbols-rounded');
    expect(iconEl).toBeInTheDocument();
  });

  it('renders colored dot when no icon prop', () => {
    render(<StatusBadge status="medium" />);
    // dot is rendered as an aria-hidden span
    const dots = document.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('applies className prop', () => {
    const { container } = render(<StatusBadge status="safe" className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('maps all 8 statuses without crashing', () => {
    const statuses = ['low', 'safe', 'caution', 'medium', 'warning', 'high', 'danger', 'critical'];
    statuses.forEach(status => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(document.querySelector('[role="status"]')).toBeInTheDocument();
      unmount();
    });
  });
});
