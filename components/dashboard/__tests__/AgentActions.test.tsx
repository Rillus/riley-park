/**
 * Tests for AgentActions component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentActions from '../AgentActions';
import { AgentStatus } from '@/lib/cursor-api';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('AgentActions', () => {
  const defaultProps = {
    agentId: 'agent-123',
    status: 'RUNNING' as AgentStatus,
    onStop: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render view conversation button for all statuses', () => {
    render(<AgentActions {...defaultProps} />);
    
    expect(screen.getByLabelText(/view conversation/i)).toBeInTheDocument();
  });

  it('should navigate to conversation on view click', () => {
    render(<AgentActions {...defaultProps} />);
    
    const viewButton = screen.getByLabelText(/view conversation/i);
    fireEvent.click(viewButton);
    
    expect(mockPush).toHaveBeenCalledWith('/agents/agent-123/conversation');
  });

  it('should show stop button only for RUNNING status', () => {
    const { rerender } = render(<AgentActions {...defaultProps} status="RUNNING" />);
    expect(screen.getByLabelText(/stop agent/i)).toBeInTheDocument();
    
    rerender(<AgentActions {...defaultProps} status="FINISHED" />);
    expect(screen.queryByLabelText(/stop agent/i)).not.toBeInTheDocument();
    
    rerender(<AgentActions {...defaultProps} status="STOPPED" />);
    expect(screen.queryByLabelText(/stop agent/i)).not.toBeInTheDocument();
    
    rerender(<AgentActions {...defaultProps} status="ERROR" />);
    expect(screen.queryByLabelText(/stop agent/i)).not.toBeInTheDocument();
  });

  it('should call onStop when stop button is clicked', async () => {
    const onStop = jest.fn().mockResolvedValue(undefined);
    render(<AgentActions {...defaultProps} onStop={onStop} />);
    
    const stopButton = screen.getByLabelText(/stop agent/i);
    fireEvent.click(stopButton);
    
    // Should show confirmation
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    
    // Confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(onStop).toHaveBeenCalledWith('agent-123');
    });
  });

  it('should show delete button only for FINISHED or STOPPED status', () => {
    const { rerender } = render(<AgentActions {...defaultProps} status="RUNNING" />);
    expect(screen.queryByLabelText(/delete agent/i)).not.toBeInTheDocument();
    
    rerender(<AgentActions {...defaultProps} status="FINISHED" />);
    expect(screen.getByLabelText(/delete agent/i)).toBeInTheDocument();
    
    rerender(<AgentActions {...defaultProps} status="STOPPED" />);
    expect(screen.getByLabelText(/delete agent/i)).toBeInTheDocument();
    
    rerender(<AgentActions {...defaultProps} status="ERROR" />);
    expect(screen.queryByLabelText(/delete agent/i)).not.toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked and confirmed', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(<AgentActions {...defaultProps} status="FINISHED" onDelete={onDelete} />);
    
    const deleteButton = screen.getByLabelText(/delete agent/i);
    fireEvent.click(deleteButton);
    
    // Should show confirmation
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    
    // Confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('agent-123');
    });
  });

  it('should cancel action when cancel button is clicked', () => {
    const onStop = jest.fn();
    render(<AgentActions {...defaultProps} onStop={onStop} />);
    
    const stopButton = screen.getByLabelText(/stop agent/i);
    fireEvent.click(stopButton);
    
    // Should show confirmation
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    
    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onStop).not.toHaveBeenCalled();
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('should show loading state while action is in progress', async () => {
    const onStop = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AgentActions {...defaultProps} onStop={onStop} />);
    
    const stopButton = screen.getByLabelText(/stop agent/i);
    fireEvent.click(stopButton);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    expect(screen.getByText(/stopping/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/stopping/i)).not.toBeInTheDocument();
    });
  });

  it('should disable buttons when disabled prop is true', () => {
    render(<AgentActions {...defaultProps} disabled />);
    
    const viewButton = screen.getByLabelText(/view conversation/i);
    const stopButton = screen.getByLabelText(/stop agent/i);
    
    expect(viewButton).toBeDisabled();
    expect(stopButton).toBeDisabled();
  });

  it('should show link to PR when prUrl is provided', () => {
    render(<AgentActions {...defaultProps} prUrl="https://github.com/user/repo/pull/123" />);
    
    const prLink = screen.getByLabelText(/view pull request/i);
    expect(prLink).toBeInTheDocument();
    expect(prLink).toHaveAttribute('href', 'https://github.com/user/repo/pull/123');
  });
});
