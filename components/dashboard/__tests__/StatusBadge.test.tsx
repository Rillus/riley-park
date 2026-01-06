/**
 * Tests for StatusBadge component
 */

import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('should render RUNNING status with correct colour', () => {
    render(<StatusBadge status="RUNNING" />);
    
    const badge = screen.getByText('RUNNING');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should render FINISHED status with correct colour', () => {
    render(<StatusBadge status="FINISHED" />);
    
    const badge = screen.getByText('FINISHED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should render STOPPED status with correct colour', () => {
    render(<StatusBadge status="STOPPED" />);
    
    const badge = screen.getByText('STOPPED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should render ERROR status with correct colour', () => {
    render(<StatusBadge status="ERROR" />);
    
    const badge = screen.getByText('ERROR');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should apply custom className', () => {
    render(<StatusBadge status="RUNNING" className="custom-class" />);
    
    const badge = screen.getByText('RUNNING');
    expect(badge).toHaveClass('custom-class');
  });

  it('should show pulse animation for RUNNING status', () => {
    render(<StatusBadge status="RUNNING" showPulse />);
    
    const badge = screen.getByText('RUNNING');
    expect(badge.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should not show pulse animation for non-RUNNING status', () => {
    render(<StatusBadge status="FINISHED" showPulse />);
    
    const badge = screen.getByText('FINISHED');
    expect(badge.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('should handle size prop', () => {
    const { rerender } = render(<StatusBadge status="RUNNING" size="sm" />);
    expect(screen.getByText('RUNNING')).toHaveClass('text-xs', 'px-2', 'py-0.5');
    
    rerender(<StatusBadge status="RUNNING" size="md" />);
    expect(screen.getByText('RUNNING')).toHaveClass('text-sm', 'px-2.5', 'py-1');
    
    rerender(<StatusBadge status="RUNNING" size="lg" />);
    expect(screen.getByText('RUNNING')).toHaveClass('text-base', 'px-3', 'py-1.5');
  });
});
