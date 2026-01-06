/**
 * Tests for FeatureDetail component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureDetail from '../FeatureDetail';
import { FeatureWithWorkflow } from '@/lib/features/types';
import { fetchFeature } from '@/lib/features';

// Mock the API client
jest.mock('@/lib/features', () => ({
  fetchFeature: jest.fn(),
}));

const mockFetchFeature = fetchFeature as jest.MockedFunction<typeof fetchFeature>;

const mockFeature: FeatureWithWorkflow & { project: { id: string; name: string } } = {
  id: 'feature-1',
  projectId: 'project-1',
  title: 'Test Feature',
  description: 'A test feature description with detailed requirements',
  priority: 'high',
  status: 'in_progress',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-05T12:00:00Z'),
  project: {
    id: 'project-1',
    name: 'Test Project',
  },
  workflowSteps: [
    {
      id: 'step-1',
      featureId: 'feature-1',
      stepType: 'spec',
      status: 'completed',
      agentId: null,
      output: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T12:00:00Z'),
    },
    {
      id: 'step-2',
      featureId: 'feature-1',
      stepType: 'design',
      status: 'completed',
      agentId: null,
      output: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-03T12:00:00Z'),
    },
    {
      id: 'step-3',
      featureId: 'feature-1',
      stepType: 'implement',
      status: 'in_progress',
      agentId: 'agent-123',
      output: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-05T12:00:00Z'),
    },
    {
      id: 'step-4',
      featureId: 'feature-1',
      stepType: 'review',
      status: 'pending',
      agentId: null,
      output: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 'step-5',
      featureId: 'feature-1',
      stepType: 'test',
      status: 'pending',
      agentId: null,
      output: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 'step-6',
      featureId: 'feature-1',
      stepType: 'submit',
      status: 'pending',
      agentId: null,
      output: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
  ],
};

describe('FeatureDetail', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnLaunchAgent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFeature.mockResolvedValue(mockFeature);
  });

  it('should render loading state initially', () => {
    mockFetchFeature.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render feature details after loading', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
      expect(screen.getByText(/A test feature description/)).toBeInTheDocument();
    });
  });

  it('should render project name', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('should render priority and status badges', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      // Multiple in_progress badges (feature status + step status)
      expect(screen.getAllByText('in_progress').length).toBeGreaterThan(0);
    });
  });

  it('should render workflow progress', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/workflow progress/i)).toBeInTheDocument();
    });
  });

  it('should render error state on fetch failure', async () => {
    mockFetchFeature.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should render edit button when onEdit is provided', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
        onEdit={mockOnEdit}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
        onEdit={mockOnEdit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(mockOnEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'feature-1' }));
  });

  it('should render delete button when onDelete is provided', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Feature')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockOnDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'feature-1' }));
  });

  it('should render launch agent button when onLaunchAgent is provided', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
        onLaunchAgent={mockOnLaunchAgent}
      />
    );

    await waitFor(() => {
      // Multiple launch agent buttons - one for each step
      const buttons = screen.getAllByRole('button', { name: /launch agent/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('should display timestamps', async () => {
    render(
      <FeatureDetail
        featureId="feature-1"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      // Created: appears once, Updated: appears multiple times (feature + each step)
      expect(screen.getByText('Created:')).toBeInTheDocument();
      expect(screen.getAllByText(/Updated:/).length).toBeGreaterThan(0);
    });
  });
});
