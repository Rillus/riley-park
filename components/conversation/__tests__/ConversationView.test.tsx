/**
 * Tests for ConversationView component
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationView from '../ConversationView';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api';

// Mock marked module
jest.mock('marked', () => ({
  marked: {
    parse: (content: string) => `<p>${content}</p>`,
    setOptions: jest.fn(),
  },
}));

jest.mock('@/lib/cursor-api/storage');
jest.mock('@/lib/cursor-api');

const mockGetApiKey = getApiKey as jest.MockedFunction<typeof getApiKey>;
const mockCursorAPIClient = CursorAPIClient as jest.MockedClass<typeof CursorAPIClient>;

describe('ConversationView', () => {
  const mockGetConversation = jest.fn();
  const mockGetAgentStatus = jest.fn();
  const mockSendFollowup = jest.fn();
  const agentId = 'agent-123';

  const mockConversation = {
    agentId,
    messages: [
      {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Please implement feature X',
        timestamp: '2025-01-01T10:00:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant' as const,
        content: 'I will implement feature X. Here is my plan:\n\n1. Step one\n2. Step two',
        timestamp: '2025-01-01T10:00:01Z',
      },
    ],
    hasMore: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetApiKey.mockReturnValue('test-api-key');
    mockCursorAPIClient.mockImplementation(() => ({
      getConversation: mockGetConversation,
      getAgentStatus: mockGetAgentStatus,
      sendFollowup: mockSendFollowup,
    } as unknown as CursorAPIClient));
    
    mockGetAgentStatus.mockResolvedValue({
      id: agentId,
      status: 'RUNNING',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should display loading state initially', () => {
    mockGetConversation.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ConversationView agentId={agentId} />);

    expect(screen.getByText(/loading conversation/i)).toBeInTheDocument();
  });

  it('should display conversation messages', async () => {
    mockGetConversation.mockResolvedValue(mockConversation);

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByText(/please implement feature x/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/i will implement feature x/i)).toBeInTheDocument();
  });

  it('should display messages in chronological order', async () => {
    mockGetConversation.mockResolvedValue(mockConversation);

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByText(/please implement feature x/i)).toBeInTheDocument();
    });

    const messages = screen.getAllByTestId(/^message-/);
    expect(messages.length).toBe(2);
    expect(messages[0]).toHaveAttribute('data-testid', 'message-msg-1');
    expect(messages[1]).toHaveAttribute('data-testid', 'message-msg-2');
  });

  it('should display error when API call fails', async () => {
    mockGetConversation.mockRejectedValue(new Error('API Error'));

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load conversation/i)).toBeInTheDocument();
    });
  });

  it('should display error when API key is missing', async () => {
    mockGetApiKey.mockReturnValue(null);

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByText(/api key not found/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no messages', async () => {
    mockGetConversation.mockResolvedValue({
      agentId,
      messages: [],
      hasMore: false,
    });

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });
  });

  it('should render follow-up input', async () => {
    mockGetConversation.mockResolvedValue(mockConversation);

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type.*message/i)).toBeInTheDocument();
    });
  });

  it('should send follow-up message', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockGetConversation.mockResolvedValue(mockConversation);
    mockSendFollowup.mockResolvedValue({ success: true });

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type.*message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type.*message/i);
    await user.type(input, 'Follow up message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSendFollowup).toHaveBeenCalledWith(agentId, {
        message: 'Follow up message',
      });
    });
  });

  it('should clear input after sending message', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockGetConversation.mockResolvedValue(mockConversation);
    mockSendFollowup.mockResolvedValue({ success: true });

    render(<ConversationView agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type.*message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type.*message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should show auto-refresh indicator when agent is running', async () => {
    mockGetConversation.mockResolvedValue(mockConversation);
    mockGetAgentStatus.mockResolvedValue({
      id: agentId,
      status: 'RUNNING',
    });

    render(<ConversationView agentId={agentId} autoRefresh={true} refreshInterval={5000} />);

    // Wait for conversation to load
    await waitFor(() => {
      expect(screen.queryByText(/loading conversation/i)).not.toBeInTheDocument();
    });

    // Verify auto-refresh indicator is shown
    await waitFor(() => {
      expect(screen.getByText(/auto-refreshing every/i)).toBeInTheDocument();
    });
  });

  it('should not poll when agent is finished', async () => {
    mockGetConversation.mockResolvedValue(mockConversation);
    mockGetAgentStatus.mockResolvedValue({
      id: agentId,
      status: 'FINISHED',
    });

    render(<ConversationView agentId={agentId} autoRefresh={true} refreshInterval={5000} />);

    await waitFor(() => {
      expect(mockGetConversation).toHaveBeenCalledTimes(1);
    });

    // Advance time by poll interval
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Should not have polled again
    expect(mockGetConversation).toHaveBeenCalledTimes(1);
  });

  it('should refresh conversation after sending follow-up', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockGetConversation.mockResolvedValue(mockConversation);
    mockSendFollowup.mockResolvedValue({ success: true });

    render(<ConversationView agentId={agentId} />);

    // Wait for conversation to load first
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type.*message/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockGetConversation).toHaveBeenCalledTimes(1);
    });

    const input = screen.getByPlaceholderText(/type.*message/i);
    await user.type(input, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockGetConversation).toHaveBeenCalledTimes(2);
    });
  });

  it('should display back button when onBack is provided', async () => {
    const onBack = jest.fn();
    mockGetConversation.mockResolvedValue(mockConversation);

    render(<ConversationView agentId={agentId} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onBack = jest.fn();
    mockGetConversation.mockResolvedValue(mockConversation);

    render(<ConversationView agentId={agentId} onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
