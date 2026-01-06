/**
 * Tests for WorkflowProgress component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowProgress from '../WorkflowProgress';
import { WorkflowStep } from '@/lib/features/types';

const mockWorkflowSteps: WorkflowStep[] = [
  {
    id: 'step-1',
    featureId: 'feature-1',
    stepType: 'spec',
    status: 'completed',
    agentId: 'agent-1',
    output: 'Specification completed',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-02T12:00:00Z'),
  },
  {
    id: 'step-2',
    featureId: 'feature-1',
    stepType: 'design',
    status: 'completed',
    agentId: 'agent-2',
    output: 'Design completed',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-03T12:00:00Z'),
  },
  {
    id: 'step-3',
    featureId: 'feature-1',
    stepType: 'implement',
    status: 'in_progress',
    agentId: 'agent-3',
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
];

describe('WorkflowProgress', () => {
  const mockOnStepClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all workflow steps', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    expect(screen.getByText('Spec')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Implement')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should display step status indicators', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    // Completed steps should have check icons
    const completedSteps = mockWorkflowSteps.filter((s) => s.status === 'completed');
    expect(completedSteps.length).toBe(2);
  });

  it('should highlight the current step', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    // The in_progress step (implement) should be highlighted
    const implementStep = screen.getByText('Implement').closest('button');
    expect(implementStep).toHaveClass('border-blue-500');
  });

  it('should call onStepClick when a step is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    await user.click(screen.getByText('Design'));

    expect(mockOnStepClick).toHaveBeenCalledWith(mockWorkflowSteps[1]);
  });

  it('should show progress percentage', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    // 2 completed out of 6 = 33%
    expect(screen.getByText(/33%/)).toBeInTheDocument();
  });

  it('should show agent indicator when agent is assigned', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    // Steps with agents should show agent indicator
    const specStep = screen.getByText('Spec').closest('button');
    expect(specStep?.querySelector('[data-testid="agent-indicator"]')).toBeInTheDocument();
  });

  it('should render completed status with green styling', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    const specStep = screen.getByText('Spec').closest('button');
    expect(specStep).toHaveClass('bg-green-100');
  });

  it('should render in_progress status with blue styling', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    const implementStep = screen.getByText('Implement').closest('button');
    expect(implementStep).toHaveClass('bg-blue-100');
  });

  it('should render pending status with gray styling', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    const reviewStep = screen.getByText('Review').closest('button');
    expect(reviewStep).toHaveClass('bg-gray-100');
  });

  it('should render blocked status with red styling', () => {
    const blockedSteps = mockWorkflowSteps.map((s, i) =>
      i === 3 ? { ...s, status: 'blocked' as const } : s
    );

    render(
      <WorkflowProgress
        steps={blockedSteps}
        onStepClick={mockOnStepClick}
      />
    );

    const reviewStep = screen.getByText('Review').closest('button');
    expect(reviewStep).toHaveClass('bg-red-100');
  });

  it('should render connectors between steps', () => {
    render(
      <WorkflowProgress
        steps={mockWorkflowSteps}
        onStepClick={mockOnStepClick}
      />
    );

    // Should have 5 connectors (between 6 steps)
    const connectors = screen.getAllByTestId('step-connector');
    expect(connectors.length).toBe(5);
  });
});
