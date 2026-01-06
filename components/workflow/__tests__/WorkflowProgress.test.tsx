/**
 * Tests for WorkflowProgress component
 */

import { render, screen } from '@testing-library/react';
import WorkflowProgress from '../WorkflowProgress';
import { WorkflowStep } from '@/lib/features/types';

const mockSteps: WorkflowStep[] = [
  { id: '1', featureId: 'f1', stepType: 'spec', status: 'completed', agentId: null, output: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', featureId: 'f1', stepType: 'design', status: 'completed', agentId: null, output: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', featureId: 'f1', stepType: 'implement', status: 'in_progress', agentId: 'agent-123', output: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', featureId: 'f1', stepType: 'review', status: 'pending', agentId: null, output: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', featureId: 'f1', stepType: 'test', status: 'pending', agentId: null, output: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '6', featureId: 'f1', stepType: 'submit', status: 'pending', agentId: null, output: null, createdAt: new Date(), updatedAt: new Date() },
];

describe('WorkflowProgress', () => {
  it('should render all workflow steps', () => {
    render(<WorkflowProgress steps={mockSteps} />);

    expect(screen.getByText('Specification')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Implementation')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should show completed status for completed steps', () => {
    render(<WorkflowProgress steps={mockSteps} />);

    // Completed steps should have a checkmark or completed styling
    const completedSteps = screen.getAllByTestId('step-completed');
    expect(completedSteps).toHaveLength(2);
  });

  it('should show in_progress status for active step', () => {
    render(<WorkflowProgress steps={mockSteps} />);

    const inProgressStep = screen.getByTestId('step-in_progress');
    expect(inProgressStep).toBeInTheDocument();
  });

  it('should show pending status for upcoming steps', () => {
    render(<WorkflowProgress steps={mockSteps} />);

    const pendingSteps = screen.getAllByTestId('step-pending');
    expect(pendingSteps).toHaveLength(3);
  });

  it('should calculate correct progress percentage', () => {
    render(<WorkflowProgress steps={mockSteps} />);

    // 2 completed + 0.5 for in_progress = 2.5/6 = ~42%
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '42');
  });

  it('should handle all completed steps', () => {
    const allCompleted = mockSteps.map(s => ({ ...s, status: 'completed' as const }));
    render(<WorkflowProgress steps={allCompleted} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('should handle all pending steps', () => {
    const allPending = mockSteps.map(s => ({ ...s, status: 'pending' as const }));
    render(<WorkflowProgress steps={allPending} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should be clickable when onStepClick is provided', async () => {
    const mockOnStepClick = jest.fn();
    const { container } = render(
      <WorkflowProgress steps={mockSteps} onStepClick={mockOnStepClick} />
    );

    const stepButtons = container.querySelectorAll('[role="button"]');
    expect(stepButtons.length).toBe(6);
  });
});
