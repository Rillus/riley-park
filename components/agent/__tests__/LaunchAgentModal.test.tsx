/**
 * Tests for LaunchAgentModal component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaunchAgentModal from '../LaunchAgentModal';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api';

// Mock the API client and storage
jest.mock('@/lib/cursor-api/storage');
jest.mock('@/lib/cursor-api');

const mockGetApiKey = getApiKey as jest.MockedFunction<typeof getApiKey>;
const mockCursorAPIClient = CursorAPIClient as jest.MockedClass<typeof CursorAPIClient>;

describe('LaunchAgentModal', () => {
  const mockLaunchAgent = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnAgentLaunched = jest.fn();

  const defaultProject = {
    id: 'project-1',
    name: 'Test Project',
    repositoryUrl: 'https://github.com/test/repo',
    defaultBranch: 'main',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApiKey.mockReturnValue('test-api-key');
    mockCursorAPIClient.mockImplementation(() => ({
      launchAgent: mockLaunchAgent,
    } as unknown as CursorAPIClient));
  });

  it('should render modal with title', () => {
    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    expect(screen.getByRole('heading', { name: 'Launch Agent' })).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <LaunchAgentModal
        isOpen={false}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    expect(screen.queryByText('Launch Agent')).not.toBeInTheDocument();
  });

  it('should pre-fill repository URL from project', () => {
    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    const repoInput = screen.getByLabelText(/repository url/i);
    expect(repoInput).toHaveValue('https://github.com/test/repo');
  });

  it('should pre-fill branch from project default branch', () => {
    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    const branchInput = screen.getByLabelText(/branch name/i);
    expect(branchInput).toHaveValue('main');
  });

  it('should allow editing the pre-filled values', async () => {
    const user = userEvent.setup();
    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    const branchInput = screen.getByLabelText(/branch name/i);
    await user.clear(branchInput);
    await user.type(branchInput, 'feature-branch');

    expect(branchInput).toHaveValue('feature-branch');
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should launch agent with correct parameters', async () => {
    const user = userEvent.setup();
    const mockResponse = { id: 'agent-123', status: 'RUNNING' as const };
    mockLaunchAgent.mockResolvedValue(mockResponse);

    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        onAgentLaunched={mockOnAgentLaunched}
        project={defaultProject}
      />
    );

    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLaunchAgent).toHaveBeenCalledWith({
        repository: 'https://github.com/test/repo',
        branch: 'main',
        prompt: 'Test prompt',
        model: 'Auto',
      });
    });

    await waitFor(() => {
      // Called with (response, workflowStepId) - undefined when no workflow step
      expect(mockOnAgentLaunched).toHaveBeenCalledWith(mockResponse, undefined);
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockLaunchAgent.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 'agent-123', status: 'RUNNING' as const }), 100))
    );

    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    expect(screen.getByText(/launching/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/launching/i)).not.toBeInTheDocument();
    });
  });

  it('should show error when API key is missing', async () => {
    const user = userEvent.setup();
    mockGetApiKey.mockReturnValue(null);

    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/api key not found/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    mockLaunchAgent.mockRejectedValue(new Error('API Error'));

    render(
      <LaunchAgentModal
        isOpen={true}
        onClose={mockOnClose}
        project={defaultProject}
      />
    );

    await user.type(screen.getByLabelText(/initial prompt/i), 'Test prompt');
    
    const submitButton = screen.getByRole('button', { name: /launch agent/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  describe('with feature context', () => {
    const defaultFeature = {
      id: 'feature-1',
      title: 'User Authentication',
      description: 'Add user login functionality',
    };

    const defaultWorkflowStep = {
      id: 'step-1',
      stepType: 'implement' as const,
    };

    // Mock Date to get consistent timestamps
    const mockDate = new Date('2026-01-06T12:30:00.000Z');
    
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should pre-fill prompt based on workflow step type', () => {
      render(
        <LaunchAgentModal
          isOpen={true}
          onClose={mockOnClose}
          project={defaultProject}
          feature={defaultFeature}
          workflowStep={defaultWorkflowStep}
        />
      );

      const promptInput = screen.getByLabelText(/initial prompt/i);
      const promptValue = (promptInput as HTMLTextAreaElement).value;
      expect(promptValue).toContain('User Authentication');
      expect(promptValue.toLowerCase()).toContain('implement');
    });

    it('should auto-generate branch name for feature workflow', () => {
      render(
        <LaunchAgentModal
          isOpen={true}
          onClose={mockOnClose}
          project={defaultProject}
          feature={defaultFeature}
          workflowStep={defaultWorkflowStep}
        />
      );

      const branchInput = screen.getByLabelText(/branch name/i);
      expect((branchInput as HTMLInputElement).value).toMatch(/^cursor\/user-authentication-\d{8}-\d{4}$/);
    });

    it('should show feature context header', () => {
      render(
        <LaunchAgentModal
          isOpen={true}
          onClose={mockOnClose}
          project={defaultProject}
          feature={defaultFeature}
          workflowStep={defaultWorkflowStep}
        />
      );

      expect(screen.getByText('User Authentication')).toBeInTheDocument();
      expect(screen.getByText('Implementation')).toBeInTheDocument();
    });
  });
});
