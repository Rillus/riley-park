/**
 * Tests for Workflow State Management
 */

import {
  validateWorkflowState,
  canExecuteStep,
  getCurrentStep,
  getNextStep,
  getPreviousStep,
  canRerunStep,
  canManuallyCompleteStep,
  getWorkflowProgress,
  validateStepOrder,
  isStepBlocked,
} from '../state-management';
import { WorkflowStepData, WorkflowStepStatus } from '../types';

// Helper to create mock workflow steps
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

describe('Workflow State Management', () => {
  describe('validateWorkflowState', () => {
    it('should validate workflow with all pending steps', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const result = validateWorkflowState(steps);

      expect(result.valid).toBe(true);
      expect(result.canExecute).toBe(true);
      expect(result.currentStep?.stepType).toBe('spec');
    });

    it('should validate workflow with completed steps', () => {
      const steps = createMockSteps(['completed', 'completed', 'in_progress', 'pending', 'pending', 'pending']);
      const result = validateWorkflowState(steps);

      expect(result.valid).toBe(true);
      expect(result.canExecute).toBe(true);
      expect(result.currentStep?.stepType).toBe('implement');
    });

    it('should detect blocked workflow', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      const result = validateWorkflowState(steps);

      expect(result.valid).toBe(true);
      expect(result.canExecute).toBe(false);
      expect(result.blockedReason).toContain('blocked');
    });

    it('should handle empty workflow steps', () => {
      const result = validateWorkflowState([]);

      expect(result.valid).toBe(false);
      expect(result.canExecute).toBe(false);
      expect(result.currentStep).toBeNull();
    });

    it('should detect invalid workflow state (out of order)', () => {
      // pending step after completed step is valid
      const steps = createMockSteps(['pending', 'completed', 'pending', 'pending', 'pending', 'pending']);
      const result = validateWorkflowState(steps);

      // This is an invalid state - can't have completed step after pending
      expect(result.valid).toBe(false);
    });
  });

  describe('canExecuteStep', () => {
    it('should allow executing first step when all pending', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canExecuteStep(steps, 'spec')).toBe(true);
    });

    it('should allow executing step after previous completed', () => {
      const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canExecuteStep(steps, 'design')).toBe(true);
    });

    it('should not allow executing step when previous not completed', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canExecuteStep(steps, 'design')).toBe(false);
      expect(canExecuteStep(steps, 'implement')).toBe(false);
    });

    it('should not allow executing step when workflow blocked', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      expect(canExecuteStep(steps, 'implement')).toBe(false);
    });

    it('should not allow executing already in_progress step', () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      expect(canExecuteStep(steps, 'design')).toBe(false);
    });

    it('should allow executing completed step (re-run)', () => {
      const steps = createMockSteps(['completed', 'completed', 'pending', 'pending', 'pending', 'pending']);
      expect(canExecuteStep(steps, 'spec', true)).toBe(true);
    });
  });

  describe('getCurrentStep', () => {
    it('should return first pending step when all pending', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const current = getCurrentStep(steps);
      expect(current?.stepType).toBe('spec');
    });

    it('should return in_progress step', () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      const current = getCurrentStep(steps);
      expect(current?.stepType).toBe('design');
    });

    it('should return first pending after completed', () => {
      const steps = createMockSteps(['completed', 'completed', 'pending', 'pending', 'pending', 'pending']);
      const current = getCurrentStep(steps);
      expect(current?.stepType).toBe('implement');
    });

    it('should return null when all completed', () => {
      const steps = createMockSteps(['completed', 'completed', 'completed', 'completed', 'completed', 'completed']);
      const current = getCurrentStep(steps);
      expect(current).toBeNull();
    });

    it('should return blocked step as current', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      const current = getCurrentStep(steps);
      expect(current?.stepType).toBe('design');
      expect(current?.status).toBe('blocked');
    });
  });

  describe('getNextStep', () => {
    it('should return next step after current', () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      const next = getNextStep(steps, 'design');
      expect(next?.stepType).toBe('implement');
    });

    it('should return null for last step', () => {
      const steps = createMockSteps(['completed', 'completed', 'completed', 'completed', 'completed', 'in_progress']);
      const next = getNextStep(steps, 'submit');
      expect(next).toBeNull();
    });

    it('should return null when step not found', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const next = getNextStep(steps, 'invalid' as never);
      expect(next).toBeNull();
    });
  });

  describe('getPreviousStep', () => {
    it('should return previous step', () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      const prev = getPreviousStep(steps, 'design');
      expect(prev?.stepType).toBe('spec');
    });

    it('should return null for first step', () => {
      const steps = createMockSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const prev = getPreviousStep(steps, 'spec');
      expect(prev).toBeNull();
    });
  });

  describe('canRerunStep', () => {
    it('should allow rerunning completed step', () => {
      const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canRerunStep(steps, 'spec')).toBe(true);
    });

    it('should not allow rerunning pending step', () => {
      const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canRerunStep(steps, 'design')).toBe(false);
    });

    it('should not allow rerunning in_progress step', () => {
      const steps = createMockSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canRerunStep(steps, 'spec')).toBe(false);
    });

    it('should allow rerunning blocked step', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      expect(canRerunStep(steps, 'design')).toBe(true);
    });
  });

  describe('canManuallyCompleteStep', () => {
    it('should allow manual completion of pending step when previous completed', () => {
      const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canManuallyCompleteStep(steps, 'design')).toBe(true);
    });

    it('should allow manual completion of in_progress step', () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      expect(canManuallyCompleteStep(steps, 'design')).toBe(true);
    });

    it('should allow manual completion of blocked step', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      expect(canManuallyCompleteStep(steps, 'design')).toBe(true);
    });

    it('should not allow manual completion when previous not completed', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canManuallyCompleteStep(steps, 'design')).toBe(false);
    });

    it('should allow manual completion of first step', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(canManuallyCompleteStep(steps, 'spec')).toBe(true);
    });
  });

  describe('getWorkflowProgress', () => {
    it('should calculate progress correctly', () => {
      const steps = createMockSteps(['completed', 'completed', 'in_progress', 'pending', 'pending', 'pending']);
      const progress = getWorkflowProgress(steps);

      expect(progress.total).toBe(6);
      expect(progress.completed).toBe(2);
      expect(progress.inProgress).toBe(1);
      expect(progress.pending).toBe(3);
      expect(progress.blocked).toBe(0);
      expect(progress.percentComplete).toBeCloseTo(33.33, 1);
    });

    it('should handle all completed', () => {
      const steps = createMockSteps(['completed', 'completed', 'completed', 'completed', 'completed', 'completed']);
      const progress = getWorkflowProgress(steps);

      expect(progress.completed).toBe(6);
      expect(progress.percentComplete).toBe(100);
    });

    it('should handle blocked steps', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      const progress = getWorkflowProgress(steps);

      expect(progress.blocked).toBe(1);
    });
  });

  describe('validateStepOrder', () => {
    it('should validate correct step order', () => {
      const steps = createMockSteps(['completed', 'completed', 'in_progress', 'pending', 'pending', 'pending']);
      expect(validateStepOrder(steps)).toBe(true);
    });

    it('should invalidate incorrect step order', () => {
      const steps = createMockSteps(['pending', 'completed', 'pending', 'pending', 'pending', 'pending']);
      expect(validateStepOrder(steps)).toBe(false);
    });

    it('should allow in_progress after completed', () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      expect(validateStepOrder(steps)).toBe(true);
    });

    it('should allow blocked after completed', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      expect(validateStepOrder(steps)).toBe(true);
    });
  });

  describe('isStepBlocked', () => {
    it('should return true when step is blocked', () => {
      const steps = createMockSteps(['completed', 'blocked', 'pending', 'pending', 'pending', 'pending']);
      expect(isStepBlocked(steps, 'design')).toBe(true);
    });

    it('should return false when step is not blocked', () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      expect(isStepBlocked(steps, 'design')).toBe(false);
    });

    it('should return false when step not found', () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      expect(isStepBlocked(steps, 'invalid' as never)).toBe(false);
    });
  });
});
