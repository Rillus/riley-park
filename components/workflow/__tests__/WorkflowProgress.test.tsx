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
    expect(screen.getByText('Submit')).toBeInTheDocument();
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

    // Check for animated pulse
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows blocked step with red X', () => {
    const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
    const { container } = render(<WorkflowProgress steps={steps} />);

    // Check for red icon
    const redElements = container.querySelectorAll('.text-red-500');
    expect(redElements.length).toBeGreaterThan(0);
  });

  it('highlights current step when currentStepType is provided', () => {
    const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
    const { container } = render(
      <WorkflowProgress steps={steps} currentStepType="design" />
    );

    // Check for ring highlight on current step
    const ringElements = container.querySelectorAll('.ring-blue-500');
    expect(ringElements.length).toBeGreaterThan(0);
  });

  it('calls onStepClick when a step is clicked', () => {
    const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
    const onStepClick = jest.fn();
    render(<WorkflowProgress steps={steps} onStepClick={onStepClick} />);

    // Find and click the first step button (by its title attribute)
    const specButton = screen.getByTitle('Specification: completed');
    fireEvent.click(specButton);

    expect(onStepClick).toHaveBeenCalledWith(steps[0]);
  });

  it('renders in compact mode without labels', () => {
    const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
    render(<WorkflowProgress steps={steps} compact />);

    // Labels should not be rendered in compact mode
    expect(screen.queryByText('Specification')).not.toBeInTheDocument();
  });

  it('shows agent running indicator for in_progress step', () => {
    const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
    render(<WorkflowProgress steps={steps} />);

    expect(screen.getByText('Agent running')).toBeInTheDocument();
  });

  it('renders completed connector line for completed steps', () => {
    const steps = createMockSteps(['completed', 'completed', 'pending', 'pending', 'pending', 'pending']);
    const { container } = render(<WorkflowProgress steps={steps} />);

    // Check for green connector lines
    const greenConnectors = container.querySelectorAll('.bg-green-500');
    expect(greenConnectors.length).toBeGreaterThanOrEqual(1);
  });
});
