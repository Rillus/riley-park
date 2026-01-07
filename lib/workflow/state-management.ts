/**
 * Workflow State Management
 * Functions for validating and managing workflow state
 */

import {
  WorkflowStepData,
  WorkflowStepType,
  WorkflowStepStatus,
  WorkflowValidationResult,
  WORKFLOW_STEP_TYPES,
} from './types';

/**
 * Workflow progress information
 */
export interface WorkflowProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  percentComplete: number;
}

/**
 * Validate the overall workflow state
 */
export function validateWorkflowState(
  steps: WorkflowStepData[]
): WorkflowValidationResult {
  if (steps.length === 0) {
    return {
      valid: false,
      canExecute: false,
      currentStep: null,
      blockedReason: 'No workflow steps found',
    };
  }

  // Check if step order is valid
  if (!validateStepOrder(steps)) {
    return {
      valid: false,
      canExecute: false,
      currentStep: getCurrentStep(steps),
      blockedReason: 'Invalid workflow step order',
    };
  }

  // Check for blocked steps
  const blockedStep = steps.find((s) => s.status === 'blocked');
  if (blockedStep) {
    return {
      valid: true,
      canExecute: false,
      currentStep: blockedStep,
      blockedReason: `Step "${blockedStep.stepType}" is blocked`,
    };
  }

  // Find current step (in_progress or first pending after completed)
  const currentStep = getCurrentStep(steps);

  return {
    valid: true,
    canExecute: true,
    currentStep,
  };
}

/**
 * Check if a specific step can be executed
 * @param steps - All workflow steps
 * @param stepType - The step type to check
 * @param allowRerun - Whether to allow rerunning completed steps
 */
export function canExecuteStep(
  steps: WorkflowStepData[],
  stepType: WorkflowStepType,
  allowRerun: boolean = false
): boolean {
  const step = steps.find((s) => s.stepType === stepType);
  if (!step) {
    return false;
  }

  // Can't execute a step that's already in progress
  if (step.status === 'in_progress') {
    return false;
  }

  // Check if workflow is blocked at or before this step
  const stepOrder = step.stepOrder;
  const blockedBefore = steps.some(
    (s) => s.stepOrder <= stepOrder && s.status === 'blocked'
  );
  if (blockedBefore) {
    return false;
  }

  // If it's already completed, only allow if rerun is enabled
  if (step.status === 'completed') {
    return allowRerun;
  }

  // First step can always be executed
  if (stepOrder === 1) {
    return true;
  }

  // Check if previous step is completed
  const previousStep = getPreviousStep(steps, stepType);
  return previousStep?.status === 'completed';
}

/**
 * Get the current step (in_progress or first pending after completed)
 */
export function getCurrentStep(
  steps: WorkflowStepData[]
): WorkflowStepData | null {
  // Sort by step order
  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  // First, check for in_progress step
  const inProgressStep = sortedSteps.find((s) => s.status === 'in_progress');
  if (inProgressStep) {
    return inProgressStep;
  }

  // Check for blocked step
  const blockedStep = sortedSteps.find((s) => s.status === 'blocked');
  if (blockedStep) {
    return blockedStep;
  }

  // Find first pending step that comes after all completed steps
  let lastCompletedOrder = 0;
  for (const step of sortedSteps) {
    if (step.status === 'completed') {
      lastCompletedOrder = step.stepOrder;
    }
  }

  // Return first pending step after last completed
  const nextPendingStep = sortedSteps.find(
    (s) => s.status === 'pending' && s.stepOrder > lastCompletedOrder
  );

  // If no pending after completed, return first pending overall
  if (!nextPendingStep) {
    const firstPending = sortedSteps.find((s) => s.status === 'pending');
    return firstPending || null;
  }

  return nextPendingStep;
}

/**
 * Get the next step after a given step type
 */
export function getNextStep(
  steps: WorkflowStepData[],
  currentStepType: WorkflowStepType
): WorkflowStepData | null {
  const currentIndex = WORKFLOW_STEP_TYPES.indexOf(currentStepType);
  if (currentIndex === -1 || currentIndex === WORKFLOW_STEP_TYPES.length - 1) {
    return null;
  }

  const nextStepType = WORKFLOW_STEP_TYPES[currentIndex + 1];
  return steps.find((s) => s.stepType === nextStepType) || null;
}

/**
 * Get the previous step before a given step type
 */
export function getPreviousStep(
  steps: WorkflowStepData[],
  currentStepType: WorkflowStepType
): WorkflowStepData | null {
  const currentIndex = WORKFLOW_STEP_TYPES.indexOf(currentStepType);
  if (currentIndex <= 0) {
    return null;
  }

  const prevStepType = WORKFLOW_STEP_TYPES[currentIndex - 1];
  return steps.find((s) => s.stepType === prevStepType) || null;
}

/**
 * Check if a step can be rerun
 */
export function canRerunStep(
  steps: WorkflowStepData[],
  stepType: WorkflowStepType
): boolean {
  const step = steps.find((s) => s.stepType === stepType);
  if (!step) {
    return false;
  }

  // Can rerun completed or blocked steps
  return step.status === 'completed' || step.status === 'blocked';
}

/**
 * Check if a step can be manually completed
 */
export function canManuallyCompleteStep(
  steps: WorkflowStepData[],
  stepType: WorkflowStepType
): boolean {
  const step = steps.find((s) => s.stepType === stepType);
  if (!step) {
    return false;
  }

  // Can't manually complete an already completed step
  if (step.status === 'completed') {
    return false;
  }

  // First step can always be manually completed
  if (step.stepOrder === 1) {
    return true;
  }

  // Check if previous step is completed
  const previousStep = getPreviousStep(steps, stepType);
  return previousStep?.status === 'completed';
}

/**
 * Get workflow progress information
 */
export function getWorkflowProgress(steps: WorkflowStepData[]): WorkflowProgress {
  const total = steps.length;
  const completed = steps.filter((s) => s.status === 'completed').length;
  const inProgress = steps.filter((s) => s.status === 'in_progress').length;
  const pending = steps.filter((s) => s.status === 'pending').length;
  const blocked = steps.filter((s) => s.status === 'blocked').length;
  const percentComplete = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    blocked,
    percentComplete,
  };
}

/**
 * Validate that steps are in correct order
 * Rules:
 * - Completed steps should come before pending steps (in order)
 * - in_progress step should be after all completed steps
 * - blocked step can be anywhere after a completed step
 */
export function validateStepOrder(steps: WorkflowStepData[]): boolean {
  // Sort by step order
  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  let foundPending = false;
  let foundInProgress = false;

  for (const step of sortedSteps) {
    // If we've seen a pending/in_progress/blocked step, we can't have completed after
    if (foundPending && step.status === 'completed') {
      return false;
    }

    if (step.status === 'pending') {
      foundPending = true;
    } else if (step.status === 'in_progress') {
      foundInProgress = true;
      foundPending = true; // Treat in_progress as a form of "not completed"
    } else if (step.status === 'blocked') {
      foundPending = true; // Treat blocked as a form of "not completed"
    }
  }

  return true;
}

/**
 * Check if a step is currently blocked
 */
export function isStepBlocked(
  steps: WorkflowStepData[],
  stepType: WorkflowStepType
): boolean {
  const step = steps.find((s) => s.stepType === stepType);
  return step?.status === 'blocked' || false;
}

/**
 * Find a step by its ID
 */
export function findStepById(
  steps: WorkflowStepData[],
  stepId: string
): WorkflowStepData | null {
  return steps.find((s) => s.id === stepId) || null;
}

/**
 * Find a step by its type
 */
export function findStepByType(
  steps: WorkflowStepData[],
  stepType: WorkflowStepType
): WorkflowStepData | null {
  return steps.find((s) => s.stepType === stepType) || null;
}

/**
 * Check if all steps are completed
 */
export function isWorkflowComplete(steps: WorkflowStepData[]): boolean {
  return steps.every((s) => s.status === 'completed');
}

/**
 * Get steps that are ready to execute (pending with previous completed)
 */
export function getReadySteps(steps: WorkflowStepData[]): WorkflowStepData[] {
  return steps.filter((step) => {
    if (step.status !== 'pending') {
      return false;
    }

    // First step is always ready if pending
    if (step.stepOrder === 1) {
      return true;
    }

    // Check if previous step is completed
    const prevStep = getPreviousStep(steps, step.stepType);
    return prevStep?.status === 'completed';
  });
}
