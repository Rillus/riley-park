/**
 * Tests for FeatureList component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureList from '../FeatureList';
import { FeatureWithWorkflow } from '@/lib/features/types';
import { fetchFeatures } from '@/lib/features';

// Mock the API client
jest.mock('@/lib/features', () => ({
  fetchFeatures: jest.fn(),
}));

const mockFetchFeatures = fetchFeatures as jest.MockedFunction<typeof fetchFeatures>;

const mockFeatures: FeatureWithWorkflow[] = [
  {
    id: 'feature-1',
    projectId: 'project-1',
    title: 'Feature One',
    description: 'First feature description',
    priority: 'high',
    status: 'in_progress',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-05T12:00:00Z'),
    workflowSteps: [],
  },
  {
    id: 'feature-2',
    projectId: 'project-1',
    title: 'Feature Two',
    description: 'Second feature description',
    priority: 'medium',
    status: 'planned',
    createdAt: new Date('2025-01-02T00:00:00Z'),
    updatedAt: new Date('2025-01-04T12:00:00Z'),
    workflowSteps: [],
  },
  {
    id: 'feature-3',
    projectId: 'project-1',
    title: 'Feature Three',
    description: 'Third feature description',
    priority: 'low',
    status: 'completed',
    createdAt: new Date('2025-01-03T00:00:00Z'),
    updatedAt: new Date('2025-01-03T12:00:00Z'),
    workflowSteps: [],
  },
];

describe('FeatureList', () => {
  const mockOnViewFeature = jest.fn();
  const mockOnEditFeature = jest.fn();
  const mockOnDeleteFeature = jest.fn();
  const mockOnCreateFeature = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFeatures.mockResolvedValue({ features: mockFeatures, total: 3 });
  });

  it('should render loading state initially', () => {
    mockFetchFeatures.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render features after loading', async () => {
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
      expect(screen.getByText('Feature Two')).toBeInTheDocument();
      expect(screen.getByText('Feature Three')).toBeInTheDocument();
    });
  });

  it('should render empty state when no features', async () => {
    mockFetchFeatures.mockResolvedValue({ features: [], total: 0 });

    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no features found/i)).toBeInTheDocument();
    });
  });

  it('should render error state on fetch failure', async () => {
    mockFetchFeatures.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('should fetch features with projectId', async () => {
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(mockFetchFeatures).toHaveBeenCalledWith('project-1', expect.any(Object));
    });
  });

  it('should render filter controls', async () => {
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by priority/i)).toBeInTheDocument();
    });
  });

  it('should filter by status', async () => {
    const user = userEvent.setup();
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/filter by status/i), 'in_progress');

    await waitFor(() => {
      expect(mockFetchFeatures).toHaveBeenCalledWith('project-1', expect.objectContaining({
        status: 'in_progress',
      }));
    });
  });

  it('should filter by priority', async () => {
    const user = userEvent.setup();
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/filter by priority/i), 'high');

    await waitFor(() => {
      expect(mockFetchFeatures).toHaveBeenCalledWith('project-1', expect.objectContaining({
        priority: 'high',
      }));
    });
  });

  it('should render sort control', async () => {
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });
  });

  it('should sort features', async () => {
    const user = userEvent.setup();
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/sort by/i), 'priority');

    await waitFor(() => {
      expect(mockFetchFeatures).toHaveBeenCalledWith('project-1', expect.objectContaining({
        sortBy: 'priority',
      }));
    });
  });

  it('should call onViewFeature when feature is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /view/i })[0]);

    expect(mockOnViewFeature).toHaveBeenCalledWith(mockFeatures[0]);
  });

  it('should call onEditFeature when edit is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
        onEditFeature={mockOnEditFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);

    expect(mockOnEditFeature).toHaveBeenCalledWith(mockFeatures[0]);
  });

  it('should call onDeleteFeature when delete is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
        onDeleteFeature={mockOnDeleteFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    expect(mockOnDeleteFeature).toHaveBeenCalledWith(mockFeatures[0]);
  });

  it('should render create button when onCreateFeature is provided', async () => {
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
        onCreateFeature={mockOnCreateFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create feature/i })).toBeInTheDocument();
    });
  });

  it('should call onCreateFeature when create button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureList
        projectId="project-1"
        onViewFeature={mockOnViewFeature}
        onCreateFeature={mockOnCreateFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Feature One')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create feature/i }));

    expect(mockOnCreateFeature).toHaveBeenCalled();
  });
});
