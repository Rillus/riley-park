/**
 * Tests for StatusFilter component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import StatusFilter from '../StatusFilter';

describe('StatusFilter', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render filter dropdown with all options', () => {
    render(<StatusFilter value="all" onChange={mockOnFilterChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('should display all status options when opened', () => {
    render(<StatusFilter value="all" onChange={mockOnFilterChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check all options exist
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('All Statuses');
    expect(options[1]).toHaveTextContent('Running');
    expect(options[2]).toHaveTextContent('Finished');
    expect(options[3]).toHaveTextContent('Stopped');
    expect(options[4]).toHaveTextContent('Error');
  });

  it('should call onChange when selection changes', () => {
    render(<StatusFilter value="all" onChange={mockOnFilterChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'RUNNING' } });
    
    expect(mockOnFilterChange).toHaveBeenCalledWith('RUNNING');
  });

  it('should show correct value when selected', () => {
    render(<StatusFilter value="RUNNING" onChange={mockOnFilterChange} />);
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('RUNNING');
  });

  it('should display agent count when provided', () => {
    const counts = {
      all: 10,
      RUNNING: 3,
      FINISHED: 5,
      STOPPED: 1,
      ERROR: 1,
    };
    
    render(
      <StatusFilter 
        value="all" 
        onChange={mockOnFilterChange} 
        counts={counts}
      />
    );
    
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('All Statuses (10)');
    expect(options[1]).toHaveTextContent('Running (3)');
    expect(options[2]).toHaveTextContent('Finished (5)');
    expect(options[3]).toHaveTextContent('Stopped (1)');
    expect(options[4]).toHaveTextContent('Error (1)');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<StatusFilter value="all" onChange={mockOnFilterChange} disabled />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });
});
