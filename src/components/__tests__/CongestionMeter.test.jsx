import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CongestionMeter } from '../../components/ui';

describe('CongestionMeter', () => {
  it('renders a progressbar with correct role', () => {
    render(<CongestionMeter value={50} label="Test Zone" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
  });

  it('sets aria-valuenow to the value prop', () => {
    render(<CongestionMeter value={72} label="Gate A" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '72');
  });

  it('sets aria-valuemin to 0 and aria-valuemax to 100', () => {
    render(<CongestionMeter value={50} label="Corridor" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows the label and percentage when label prop is provided', () => {
    render(<CongestionMeter value={65} label="Inner North" />);
    expect(screen.getByText('Inner North')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('does not render label text when label prop is omitted', () => {
    render(<CongestionMeter value={40} />);
    // No label text but progressbar should still be there
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('40%')).not.toBeInTheDocument();
  });

  it('clamps values — does not crash at 0', () => {
    render(<CongestionMeter value={0} label="Min" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps values — does not crash at 100', () => {
    render(<CongestionMeter value={100} label="Max" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('applies aria-label with label + value', () => {
    render(<CongestionMeter value={82} label="Gate D" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toContain('82%');
    expect(bar.getAttribute('aria-label')).toContain('Gate D');
  });
});
