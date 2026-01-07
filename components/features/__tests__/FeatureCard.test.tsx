/**
 * Tests for FeatureCard component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureCard from '../FeatureCard';
import { FeatureWithWorkflow } from '@/lib/features/types';

const mockFeature: FeatureWithWorkflow = {
  id: 'feature-1',
  projectId: 'project-1',
  title: 'Test Feature',
  description: 'A test feature description',
  priority: 'high',
  status: 'in_progress',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-05T12:00:00Z'),
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

describe('FeatureCard', () => {
  const mockOnView = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render feature title', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('should render feature description', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('A test feature description')).toBeInTheDocument();
  });

  it('should render priority badge', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('in_progress')).toBeInTheDocument();
  });

  it('should render workflow progress', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    // Should show 2 completed out of 6 steps = 33%
    expect(screen.getByText('2/6 steps')).toBeInTheDocument();
  });

  it('should render current workflow step', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    // Current step should be "implement" (in_progress)
    expect(screen.getByText(/implementation/i)).toBeInTheDocument();
  });

  it('should call onView when View button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    await user.click(screen.getByRole('button', { name: /view/i }));
    expect(mockOnView).toHaveBeenCalledWith(mockFeature);
  });

  it('should call onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(mockOnEdit).toHaveBeenCalledWith(mockFeature);
  });

  it('should call onDelete when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
        onDelete={mockOnDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockOnDelete).toHaveBeenCalledWith(mockFeature);
  });

  it('should not render Edit button if onEdit is not provided', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('should not render Delete button if onDelete is not provided', () => {
    render(
      <FeatureCard
        feature={mockFeature}
        onView={mockOnView}
      />
    );

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  describe('Priority badge colours', () => {
    it('should render high priority with red styling', () => {
      render(
        <FeatureCard
          feature={{ ...mockFeature, priority: 'high' }}
          onView={mockOnView}
        />
      );

      const badge = screen.getByText('high');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('should render medium priority with yellow styling', () => {
      render(
        <FeatureCard
          feature={{ ...mockFeature, priority: 'medium' }}
          onView={mockOnView}
        />
      );

      const badge = screen.getByText('medium');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('should render low priority with green styling', () => {
      render(
        <FeatureCard
          feature={{ ...mockFeature, priority: 'low' }}
          onView={mockOnView}
        />
      );

      const badge = screen.getByText('low');
      expect(badge).toHaveClass('bg-green-100');
    });
  });

  describe('Status badge colours', () => {
    it('should render planned status with gray styling', () => {
      render(
        <FeatureCard
          feature={{ ...mockFeature, status: 'planned' }}
          onView={mockOnView}
        />
      );

      const badge = screen.getByText('planned');
      expect(badge).toHaveClass('bg-gray-100');
    });

    it('should render in_progress status with blue styling', () => {
      render(
        <FeatureCard
          feature={{ ...mockFeature, status: 'in_progress' }}
          onView={mockOnView}
        />
      );

      const badge = screen.getByText('in_progress');
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('should render completed status with green styling', () => {
      render(
        <FeatureCard
          feature={{ ...mockFeature, status: 'completed' }}
          onView={mockOnView}
        />
      );

      const badge = screen.getByText('completed');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('should render blocked status with red styling', () => {
      render(
        <FeatureCard
          feature={{ ...mockFeature, status: 'blocked' }}
          onView={mockOnView}
        />
      );

      const badge = screen.getByText('blocked');
      expect(badge).toHaveClass('bg-red-100');
    });
  });
});
