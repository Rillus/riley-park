/**
 * Tests for AgentStatusDisplay component
 */

import { render, screen, waitFor } from '@testing-library/react';
import AgentStatusDisplay from '../AgentStatus';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api';

jest.mock('@/lib/cursor-api/storage');
jest.mock('@/lib/cursor-api');

const mockGetApiKey = getApiKey as jest.MockedFunction<typeof getApiKey>;
const mockCursorAPIClient = CursorAPIClient as jest.MockedClass<typeof CursorAPIClient>;

describe('AgentStatusDisplay', () => {
  const mockGetAgentStatus = jest.fn();
  const agentId = 'agent-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetApiKey.mockReturnValue('test-api-key');
    mockCursorAPIClient.mockImplementation(() => ({
      getAgentStatus: mockGetAgentStatus,
    } as unknown as CursorAPIClient));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should display loading state initially', () => {
    mockGetAgentStatus.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AgentStatusDisplay agentId={agentId} autoRefresh={false} />);

    expect(screen.getByText(/loading agent status/i)).toBeInTheDocument();
  });

  it('should display agent status', async () => {
    const mockStatus = {
      id: agentId,
      status: 'RUNNING' as const,
      repository: 'https://github.com/user/repo',
      branch: 'main',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    mockGetAgentStatus.mockResolvedValue(mockStatus);

    render(<AgentStatusDisplay agentId={agentId} autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/agent status/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(agentId)).toBeInTheDocument();
    });

    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getByText(mockStatus.repository)).toBeInTheDocument();
    expect(screen.getByText(mockStatus.branch)).toBeInTheDocument();
  });

  it('should display error when API call fails', async () => {
    mockGetAgentStatus.mockRejectedValue(new Error('API Error'));

    render(<AgentStatusDisplay agentId={agentId} autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('should display error when API key is missing', async () => {
    mockGetApiKey.mockReturnValue(null);

    render(<AgentStatusDisplay agentId={agentId} autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/api key not found/i)).toBeInTheDocument();
    });
  });

  it('should auto-refresh when agent is running', async () => {
    const mockStatus = {
      id: agentId,
      status: 'RUNNING' as const,
    };

    mockGetAgentStatus.mockResolvedValue(mockStatus);

    render(<AgentStatusDisplay agentId={agentId} autoRefresh={true} refreshInterval={1000} />);

    await waitFor(() => {
      expect(mockGetAgentStatus).toHaveBeenCalledTimes(1);
    });

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockGetAgentStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('should not auto-refresh when agent is not running', async () => {
    const mockStatus = {
      id: agentId,
      status: 'FINISHED' as const,
    };

    mockGetAgentStatus.mockResolvedValue(mockStatus);

    render(<AgentStatusDisplay agentId={agentId} autoRefresh={true} refreshInterval={1000} />);

    await waitFor(() => {
      expect(mockGetAgentStatus).toHaveBeenCalledTimes(1);
    });

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Should not call again
    expect(mockGetAgentStatus).toHaveBeenCalledTimes(1);
  });

  it('should not auto-refresh when autoRefresh is disabled', async () => {
    const mockStatus = {
      id: agentId,
      status: 'RUNNING' as const,
    };

    mockGetAgentStatus.mockResolvedValue(mockStatus);

    render(<AgentStatusDisplay agentId={agentId} autoRefresh={false} />);

    await waitFor(() => {
      expect(mockGetAgentStatus).toHaveBeenCalledTimes(1);
    });

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    // Should not call again
    expect(mockGetAgentStatus).toHaveBeenCalledTimes(1);
  });

  it('should display different status badges with correct colors', async () => {
    const statuses: Array<'RUNNING' | 'FINISHED' | 'STOPPED' | 'ERROR'> = [
      'RUNNING',
      'FINISHED',
      'STOPPED',
      'ERROR',
    ];

    for (const status of statuses) {
      mockGetAgentStatus.mockResolvedValue({
        id: agentId,
        status,
      });

      const { rerender } = render(
        <AgentStatusDisplay agentId={agentId} autoRefresh={false} />
      );

      await waitFor(() => {
        expect(screen.getByText(status)).toBeInTheDocument();
      });

      rerender(<div />);
    }
  });
});

