/**
 * Tests for FollowupForm component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FollowupForm from '../FollowupForm';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api';

jest.mock('@/lib/cursor-api/storage');
jest.mock('@/lib/cursor-api');

const mockGetApiKey = getApiKey as jest.MockedFunction<typeof getApiKey>;
const mockCursorAPIClient = CursorAPIClient as jest.MockedClass<typeof CursorAPIClient>;

describe('FollowupForm', () => {
  const mockSendFollowup = jest.fn();
  const mockOnMessageSent = jest.fn();
  const agentId = 'agent-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApiKey.mockReturnValue('test-api-key');
    mockCursorAPIClient.mockImplementation(() => ({
      sendFollowup: mockSendFollowup,
    } as unknown as CursorAPIClient));
  });

  it('should render form fields', () => {
    render(<FollowupForm agentId={agentId} />);

    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should send follow-up message on valid form submission', async () => {
    const user = userEvent.setup();
    mockSendFollowup.mockResolvedValue({ success: true });

    render(<FollowupForm agentId={agentId} onMessageSent={mockOnMessageSent} />);

    await user.type(screen.getByLabelText(/message/i), 'Test follow-up message');
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSendFollowup).toHaveBeenCalledWith(agentId, {
        message: 'Test follow-up message',
      });
    });

    await waitFor(() => {
      expect(mockOnMessageSent).toHaveBeenCalled();
    });

    expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    const user = userEvent.setup();
    mockSendFollowup.mockRejectedValue(new Error('API Error'));

    render(<FollowupForm agentId={agentId} />);

    await user.type(screen.getByLabelText(/message/i), 'Test message');
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('should show error when API key is missing', async () => {
    const user = userEvent.setup();
    mockGetApiKey.mockReturnValue(null);

    render(<FollowupForm agentId={agentId} />);

    await user.type(screen.getByLabelText(/message/i), 'Test message');
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/api key not found/i)).toBeInTheDocument();
    });

    expect(mockSendFollowup).not.toHaveBeenCalled();
  });

  it('should reset form after successful send', async () => {
    const user = userEvent.setup();
    mockSendFollowup.mockResolvedValue({ success: true });

    render(<FollowupForm agentId={agentId} />);

    const messageInput = screen.getByLabelText(/message/i);
    await user.type(messageInput, 'Test message');
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockSendFollowup.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    render(<FollowupForm agentId={agentId} />);

    await user.type(screen.getByLabelText(/message/i), 'Test message');
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/sending/i)).not.toBeInTheDocument();
    });
  });
});

