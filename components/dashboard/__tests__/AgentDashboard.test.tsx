/**
 * Tests for AgentDashboard component
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import AgentDashboard from '../AgentDashboard';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api';

jest.mock('@/lib/cursor-api/storage');
jest.mock('@/lib/cursor-api');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockGetApiKey = getApiKey as jest.MockedFunction<typeof getApiKey>;
const mockCursorAPIClient = CursorAPIClient as jest.MockedClass<typeof CursorAPIClient>;

describe('AgentDashboard', () => {
  const mockListAgents = jest.fn();
  const mockStopAgent = jest.fn();
  const mockDeleteAgent = jest.fn();

  const mockAgents = {
    agents: [
      {
        id: 'agent-1',
        status: 'RUNNING' as const,
        source: { repository: 'https://github.com/user/repo1', ref: 'main' },
        target: { branchName: 'feature-1' },
        createdAt: '2025-01-06T10:00:00Z',
      },
      {
        id: 'agent-2',
        status: 'FINISHED' as const,
        source: { repository: 'https://github.com/user/repo2', ref: 'develop' },
        target: { branchName: 'feature-2', prUrl: 'https://github.com/user/repo2/pull/123' },
        createdAt: '2025-01-06T09:00:00Z',
      },
      {
        id: 'agent-3',
        status: 'STOPPED' as const,
        source: { repository: 'https://github.com/user/repo3' },
        createdAt: '2025-01-06T08:00:00Z',
      },
      {
        id: 'agent-4',
        status: 'ERROR' as const,
        source: { repository: 'https://github.com/user/repo4' },
        createdAt: '2025-01-06T07:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetApiKey.mockReturnValue('test-api-key');
    mockListAgents.mockResolvedValue(mockAgents);
    mockStopAgent.mockResolvedValue({ id: 'agent-1', status: 'STOPPED' });
    mockDeleteAgent.mockResolvedValue({ success: true });
    mockCursorAPIClient.mockImplementation(() => ({
      listAgents: mockListAgents,
      stopAgent: mockStopAgent,
      deleteAgent: mockDeleteAgent,
    } as unknown as CursorAPIClient));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should display loading state initially', () => {
    mockListAgents.mockImplementation(() => new Promise(() => {}));
    render(<AgentDashboard />);
    expect(screen.getByText(/loading agents/i)).toBeInTheDocument();
  });

  it('should display all agents after loading', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('agent-2')).toBeInTheDocument();
    expect(screen.getByText('agent-3')).toBeInTheDocument();
    expect(screen.getByText('agent-4')).toBeInTheDocument();
  });

  it('should display agent status badges', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument();
    });
    
    expect(screen.getByText('FINISHED')).toBeInTheDocument();
    expect(screen.getByText('STOPPED')).toBeInTheDocument();
    expect(screen.getByText('ERROR')).toBeInTheDocument();
  });

  it('should display repository information', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('https://github.com/user/repo1')).toBeInTheDocument();
    });
  });

  it('should display error when API call fails', async () => {
    mockListAgents.mockRejectedValue(new Error('API Error'));
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('should display error when API key is missing', async () => {
    mockGetApiKey.mockReturnValue(null);
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/api key not found/i)).toBeInTheDocument();
    });
  });

  it('should filter agents by status', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-1')).toBeInTheDocument();
    });
    
    // Filter by RUNNING
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'RUNNING' } });
    
    expect(screen.getByText('agent-1')).toBeInTheDocument();
    expect(screen.queryByText('agent-2')).not.toBeInTheDocument();
    expect(screen.queryByText('agent-3')).not.toBeInTheDocument();
    expect(screen.queryByText('agent-4')).not.toBeInTheDocument();
  });

  it('should show status counts in filter', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-1')).toBeInTheDocument();
    });
    
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('All Statuses (4)');
    expect(options[1]).toHaveTextContent('Running (1)');
    expect(options[2]).toHaveTextContent('Finished (1)');
    expect(options[3]).toHaveTextContent('Stopped (1)');
    expect(options[4]).toHaveTextContent('Error (1)');
  });

  it('should auto-refresh agent list', async () => {
    render(<AgentDashboard refreshInterval={5000} />);
    
    await waitFor(() => {
      expect(mockListAgents).toHaveBeenCalledTimes(1);
    });
    
    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    await waitFor(() => {
      expect(mockListAgents).toHaveBeenCalledTimes(2);
    });
  });

  it('should not auto-refresh when autoRefresh is disabled', async () => {
    render(<AgentDashboard autoRefresh={false} />);
    
    await waitFor(() => {
      expect(mockListAgents).toHaveBeenCalledTimes(1);
    });
    
    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Should still be 1
    expect(mockListAgents).toHaveBeenCalledTimes(1);
  });

  it('should stop agent when stop action is confirmed', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-1')).toBeInTheDocument();
    });
    
    // Find and click stop button
    const stopButtons = screen.getAllByLabelText(/stop agent/i);
    fireEvent.click(stopButtons[0]);
    
    // Confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockStopAgent).toHaveBeenCalledWith('agent-1');
    });
  });

  it('should delete agent when delete action is confirmed', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-2')).toBeInTheDocument();
    });
    
    // Find and click delete button (for FINISHED agent)
    const deleteButtons = screen.getAllByLabelText(/delete agent/i);
    fireEvent.click(deleteButtons[0]);
    
    // Confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockDeleteAgent).toHaveBeenCalledWith('agent-2');
    });
  });

  it('should display empty state when no agents', async () => {
    mockListAgents.mockResolvedValue({ agents: [] });
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/no agents found/i)).toBeInTheDocument();
    });
  });

  it('should highlight status changes on refresh', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-1')).toBeInTheDocument();
    });
    
    // Update mock to return changed status
    mockListAgents.mockResolvedValue({
      agents: [
        {
          ...mockAgents.agents[0],
          status: 'FINISHED' as const,
        },
        ...mockAgents.agents.slice(1),
      ],
    });
    
    // Trigger refresh
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    await waitFor(() => {
      // Look for the highlight class on the agent row
      const agentRow = screen.getByText('agent-1').closest('[data-agent-id="agent-1"]');
      expect(agentRow).toHaveClass('ring-2', 'ring-yellow-400');
    });
  });

  it('should show last refresh time', async () => {
    jest.setSystemTime(new Date('2025-01-06T12:00:00Z'));
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/last updated/i)).toBeInTheDocument();
    });
  });

  it('should show PR link when available', async () => {
    render(<AgentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-2')).toBeInTheDocument();
    });
    
    const prLink = screen.getByLabelText(/view pull request/i);
    expect(prLink).toHaveAttribute('href', 'https://github.com/user/repo2/pull/123');
  });

  it('should call onAgentSelect when agent is clicked', async () => {
    const onAgentSelect = jest.fn();
    render(<AgentDashboard onAgentSelect={onAgentSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('agent-1')).toBeInTheDocument();
    });
    
    // Click on agent row
    const agentRow = screen.getByText('agent-1').closest('[data-agent-id="agent-1"]');
    if (agentRow) {
      fireEvent.click(agentRow);
    }
    
    expect(onAgentSelect).toHaveBeenCalledWith('agent-1');
  });
});
