/**
 * Tests for LaunchAgentForm component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaunchAgentForm from '../LaunchAgentForm';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api';

// Mock the API client and storage
jest.mock('@/lib/cursor-api/storage');
jest.mock('@/lib/cursor-api');

const mockGetApiKey = getApiKey as jest.MockedFunction<typeof getApiKey>;
const mockCursorAPIClient = CursorAPIClient as jest.MockedClass<typeof CursorAPIClient>;

describe('LaunchAgentForm', () => {
  const mockLaunchAgent = jest.fn();
  const mockOnAgentLaunched = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApiKey.mockReturnValue('test-api-key');
    mockCursorAPIClient.mockImplementation(() => ({
      launchAgent: mockLaunchAgent,
    } as unknown as CursorAPIClient));
  });

  it('should render form fields', () => {
    render(<LaunchAgentForm />);

    expect(screen.getByLabelText(/repository url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/branch name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/initial prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /launch agent/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<LaunchAgentForm />);

    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLaunchAgent).not.toHaveBeenCalled();
    });
  });

  it('should launch agent on valid form submission', async () => {
    const user = userEvent.setup();
    const mockResponse = { id: 'agent-123', status: 'RUNNING' as const };
    mockLaunchAgent.mockResolvedValue(mockResponse);

    render(<LaunchAgentForm onAgentLaunched={mockOnAgentLaunched} />);

    const repositoryInput = screen.getByLabelText(/repository url/i);
    await user.clear(repositoryInput);
    await user.type(repositoryInput, 'https://github.com/user/repo');
    await user.type(screen.getByLabelText(/branch name/i), 'main');
    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLaunchAgent).toHaveBeenCalledWith({
        repository: 'https://github.com/user/repo',
        branch: 'main',
        prompt: 'Test prompt',
        model: 'Auto',
      });
    });

    await waitFor(() => {
      expect(mockOnAgentLaunched).toHaveBeenCalledWith(mockResponse);
    });

    expect(screen.getByText(/agent launched successfully/i)).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    const user = userEvent.setup();
    mockLaunchAgent.mockRejectedValue(new Error('API Error'));

    render(<LaunchAgentForm />);

    const repositoryInput = screen.getByLabelText(/repository url/i);
    await user.clear(repositoryInput);
    await user.type(repositoryInput, 'https://github.com/user/repo');
    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('should show error when API key is missing', async () => {
    const user = userEvent.setup();
    mockGetApiKey.mockReturnValue(null);

    render(<LaunchAgentForm />);

    const repositoryInput = screen.getByLabelText(/repository url/i);
    await user.clear(repositoryInput);
    await user.type(repositoryInput, 'https://github.com/user/repo');
    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/api key not found/i)).toBeInTheDocument();
    });

    expect(mockLaunchAgent).not.toHaveBeenCalled();
  });

  it('should reset form after successful launch', async () => {
    const user = userEvent.setup();
    mockLaunchAgent.mockResolvedValue({ id: 'agent-123', status: 'RUNNING' as const });

    render(<LaunchAgentForm />);

    const repositoryInput = screen.getByLabelText(/repository url/i);
    const promptInput = screen.getByLabelText(/initial prompt/i);

    // Clear default value and type new one
    await user.clear(repositoryInput);
    await user.type(repositoryInput, 'https://github.com/user/repo');
    await user.type(promptInput, 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    // After successful launch, prompt is reset to empty and repository resets to default
    await waitFor(() => {
      expect(promptInput).toHaveValue('');
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockLaunchAgent.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ id: 'agent-123', status: 'RUNNING' as const }), 100)));

    render(<LaunchAgentForm />);

    const repositoryInput = screen.getByLabelText(/repository url/i);
    await user.clear(repositoryInput);
    await user.type(repositoryInput, 'https://github.com/user/repo');
    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    expect(screen.getByText(/launching/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/launching/i)).not.toBeInTheDocument();
    });
  });
});
