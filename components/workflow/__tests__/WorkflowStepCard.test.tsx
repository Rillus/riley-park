/**
 * Tests for WorkflowStepCard component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowStepCard from '../WorkflowStepCard';
import { WorkflowStep } from '@/lib/features/types';

const baseStep: WorkflowStep = {
  id: 'step-1',
  featureId: 'feature-1',
  stepType: 'implement',
  status: 'pending',
  agentId: null,
  output: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('WorkflowStepCard', () => {
  const mockOnLaunchAgent = jest.fn();
  const mockOnMarkComplete = jest.fn();
  const mockOnViewAgent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render step type label', () => {
    render(<WorkflowStepCard step={baseStep} />);
    expect(screen.getByText('Implementation')).toBeInTheDocument();
  });

  it('should show pending status', () => {
    render(<WorkflowStepCard step={baseStep} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('should show in_progress status', () => {
    const inProgressStep = { ...baseStep, status: 'in_progress' as const };
    render(<WorkflowStepCard step={inProgressStep} />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it('should show completed status', () => {
    const completedStep = { ...baseStep, status: 'completed' as const };
    render(<WorkflowStepCard step={completedStep} />);
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('should show blocked status', () => {
    const blockedStep = { ...baseStep, status: 'blocked' as const };
    render(<WorkflowStepCard step={blockedStep} />);
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
  });

  it('should show Launch Agent button when no agent assigned', () => {
    render(
      <WorkflowStepCard 
        step={baseStep}
        onLaunchAgent={mockOnLaunchAgent}
      />
    );
    expect(screen.getByRole('button', { name: /launch agent/i })).toBeInTheDocument();
  });

  it('should call onLaunchAgent when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WorkflowStepCard 
        step={baseStep}
        onLaunchAgent={mockOnLaunchAgent}
      />
    );

    await user.click(screen.getByRole('button', { name: /launch agent/i }));
    expect(mockOnLaunchAgent).toHaveBeenCalledWith(baseStep);
  });

  it('should show View Agent button when agent is assigned', () => {
    const stepWithAgent = { ...baseStep, agentId: 'agent-123', status: 'in_progress' as const };
    render(
      <WorkflowStepCard 
        step={stepWithAgent}
        onViewAgent={mockOnViewAgent}
      />
    );
    expect(screen.getByRole('button', { name: /view agent/i })).toBeInTheDocument();
  });

  it('should call onViewAgent when button is clicked', async () => {
    const user = userEvent.setup();
    const stepWithAgent = { ...baseStep, agentId: 'agent-123', status: 'in_progress' as const };
    render(
      <WorkflowStepCard 
        step={stepWithAgent}
        onViewAgent={mockOnViewAgent}
      />
    );

    await user.click(screen.getByRole('button', { name: /view agent/i }));
    expect(mockOnViewAgent).toHaveBeenCalledWith('agent-123');
  });

  it('should show Mark Complete button for in_progress steps', () => {
    const inProgressStep = { ...baseStep, status: 'in_progress' as const };
    render(
      <WorkflowStepCard 
        step={inProgressStep}
        onMarkComplete={mockOnMarkComplete}
      />
    );
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
  });

  it('should call onMarkComplete when button is clicked', async () => {
    const user = userEvent.setup();
    const inProgressStep = { ...baseStep, status: 'in_progress' as const };
    render(
      <WorkflowStepCard 
        step={inProgressStep}
        onMarkComplete={mockOnMarkComplete}
      />
    );

    await user.click(screen.getByRole('button', { name: /mark complete/i }));
    expect(mockOnMarkComplete).toHaveBeenCalledWith(inProgressStep);
  });

  it('should not show Launch Agent button for completed steps', () => {
    const completedStep = { ...baseStep, status: 'completed' as const };
    render(
      <WorkflowStepCard 
        step={completedStep}
        onLaunchAgent={mockOnLaunchAgent}
      />
    );
    expect(screen.queryByRole('button', { name: /launch agent/i })).not.toBeInTheDocument();
  });

  it('should show Re-run button for completed steps', () => {
    const completedStep = { ...baseStep, status: 'completed' as const };
    render(
      <WorkflowStepCard 
        step={completedStep}
        onLaunchAgent={mockOnLaunchAgent}
      />
    );
    expect(screen.getByRole('button', { name: /re-run/i })).toBeInTheDocument();
  });

  it('should display agent ID when assigned', () => {
    const stepWithAgent = { ...baseStep, agentId: 'agent-xyz-123' };
    render(<WorkflowStepCard step={stepWithAgent} />);
    expect(screen.getByText(/agent-xyz-123/)).toBeInTheDocument();
  });
});
