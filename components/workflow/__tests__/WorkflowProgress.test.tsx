/**
 * Tests for WorkflowProgress component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import WorkflowProgress from '../WorkflowProgress';
import { WorkflowStepData, WorkflowStepStatus } from '@/lib/workflow/types';

function createMockSteps(statuses: WorkflowStepStatus[]): WorkflowStepData[] {
  const stepTypes = ['spec', 'design', 'implement', 'review', 'test', 'submit'] as const;
  return statuses.map((status, index) => ({
    id: `step-${index + 1}`,
    featureId: 'feature-1',
    stepType: stepTypes[index],
    stepOrder: index + 1,
    status,
    agentId: status === 'in_progress' ? `agent-${index}` : null,
    output: status === 'completed' ? `Output for ${stepTypes[index]}` : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

describe('WorkflowProgress', () => {
  it('renders all workflow steps', () => {
    const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
    render(<WorkflowProgress steps={steps} />);

    expect(screen.getByText('Specification')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Implementation')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('Submit (PR)')).toBeInTheDocument();
  });

  it('shows completed step with green checkmark', () => {
    const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
    const { container } = render(<WorkflowProgress steps={steps} />);

    // Check for green checkmark icon
    const greenElements = container.querySelectorAll('.text-green-500');
    expect(greenElements.length).toBeGreaterThan(0);
  });

  it('shows in_progress step with blue pulse', () => {
    const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
    const { container } = render(<WorkflowProgress steps={steps} />);

    // Check for blue pulse animation
    const blueElements = container.querySelectorAll('.bg-blue-500.animate-pulse');
    expect(blueElements.length).toBeGreaterThan(0);
  });

  it('handles step click when onStepClick is provided', () => {
    const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
    const mockOnStepClick = jest.fn();
    const { container } = render(
      <WorkflowProgress steps={steps} onStepClick={mockOnStepClick} />
    );

    const buttons = container.querySelectorAll('button');
    const clickableButton = Array.from(buttons).find(btn => !btn.disabled);

    if (clickableButton) {
      fireEvent.click(clickableButton);
      expect(mockOnStepClick).toHaveBeenCalled();
    }
  });

  it('highlights current step when currentStepType is provided', () => {
    const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
    const { container } = render(
      <WorkflowProgress steps={steps} currentStepType="implement" />
    );

    // Check for ring styling on current step
    const ringElements = container.querySelectorAll('.ring-2.ring-blue-500');
    expect(ringElements.length).toBeGreaterThan(0);
  });

  it('shows compact mode when compact prop is true', () => {
    const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
    const { container } = render(
      <WorkflowProgress steps={steps} compact={true} />
    );

    // In compact mode, labels should not be visible
    const labels = container.querySelectorAll('p.text-xs');
    expect(labels.length).toBe(0);
  });
});
