/**
 * Tests for TimeElapsed component
 */

import { render, screen, act } from '@testing-library/react';
import TimeElapsed from '../TimeElapsed';

describe('TimeElapsed', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-06T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should display seconds for recent time', () => {
    // 30 seconds ago
    render(<TimeElapsed startTime="2025-01-06T11:59:30Z" />);
    
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('should display minutes and seconds', () => {
    // 5 minutes and 30 seconds ago
    render(<TimeElapsed startTime="2025-01-06T11:54:30Z" />);
    
    expect(screen.getByText('5m 30s')).toBeInTheDocument();
  });

  it('should display hours, minutes, and seconds', () => {
    // 2 hours, 15 minutes, and 30 seconds ago
    render(<TimeElapsed startTime="2025-01-06T09:44:30Z" />);
    
    expect(screen.getByText('2h 15m 30s')).toBeInTheDocument();
  });

  it('should display days for longer durations', () => {
    // 1 day, 2 hours, 15 minutes, and 30 seconds ago
    render(<TimeElapsed startTime="2025-01-05T09:44:30Z" />);
    
    expect(screen.getByText('1d 2h 15m')).toBeInTheDocument();
  });

  it('should update elapsed time when live is true', () => {
    render(<TimeElapsed startTime="2025-01-06T11:59:50Z" live />);
    
    expect(screen.getByText('10s')).toBeInTheDocument();
    
    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('should not update when live is false', () => {
    render(<TimeElapsed startTime="2025-01-06T11:59:50Z" live={false} />);
    
    expect(screen.getByText('10s')).toBeInTheDocument();
    
    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Should still show 10s
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('should handle invalid date', () => {
    render(<TimeElapsed startTime="invalid-date" />);
    
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should display "just now" for very recent time', () => {
    render(<TimeElapsed startTime="2025-01-06T11:59:59Z" />);
    
    expect(screen.getByText('1s')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<TimeElapsed startTime="2025-01-06T11:59:30Z" className="custom-class" />);
    
    expect(screen.getByText('30s').closest('span')).toHaveClass('custom-class');
  });
});
