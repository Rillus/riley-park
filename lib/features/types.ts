/**
 * Types for Feature Management
 */

import { z } from 'zod';

// Enums
export const Priority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const FeatureStatus = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const;

export type FeatureStatus = (typeof FeatureStatus)[keyof typeof FeatureStatus];

export const StepType = {
  SPEC: 'spec',
  DESIGN: 'design',
  IMPLEMENT: 'implement',
  REVIEW: 'review',
  TEST: 'test',
  SUBMIT: 'submit',
} as const;

export type StepType = (typeof StepType)[keyof typeof StepType];

export const WorkflowStepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const;

export type WorkflowStepStatus = (typeof WorkflowStepStatus)[keyof typeof WorkflowStepStatus];

// Workflow steps order
export const WORKFLOW_STEPS_ORDER: StepType[] = [
  StepType.SPEC,
  StepType.DESIGN,
  StepType.IMPLEMENT,
  StepType.REVIEW,
  StepType.TEST,
  StepType.SUBMIT,
];

// Step display names
export const STEP_DISPLAY_NAMES: Record<StepType, string> = {
  [StepType.SPEC]: 'Specification',
  [StepType.DESIGN]: 'Design',
  [StepType.IMPLEMENT]: 'Implementation',
  [StepType.REVIEW]: 'Review',
  [StepType.TEST]: 'Testing',
  [StepType.SUBMIT]: 'Submit (PR)',
};

// Zod schemas for validation
export const createFeatureSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description is too long'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
});

export const updateFeatureSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description is too long').optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'blocked']).optional(),
});

export const updateWorkflowStepSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).optional(),
  agentId: z.string().nullable().optional(),
  output: z.string().nullable().optional(),
});

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
export type UpdateWorkflowStepInput = z.infer<typeof updateWorkflowStepSchema>;

// Feature type matching the database model
export interface Feature {
  id: string;
  projectId: string;
  externalId: string | null;
  title: string;
  description: string;
  priority: Priority;
  status: FeatureStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Feature with workflow steps
export interface FeatureWithWorkflow extends Feature {
  workflowSteps: WorkflowStep[];
}

// Feature with project info
export interface FeatureWithProject extends Feature {
  project: {
    id: string;
    name: string;
  };
}

// WorkflowStep type matching the database model
export interface WorkflowStep {
  id: string;
  featureId: string;
  stepType: StepType;
  status: WorkflowStepStatus;
  agentId: string | null;
  output: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface FeatureListResponse {
  features: Feature[];
  total: number;
}

export interface FeatureResponse {
  feature: FeatureWithWorkflow;
}

export interface WorkflowStepsResponse {
  workflowSteps: WorkflowStep[];
}

export interface FeatureErrorResponse {
  error: string;
  details?: unknown;
}

// Helper to get current workflow step
export function getCurrentWorkflowStep(steps: WorkflowStep[]): WorkflowStep | undefined {
  // Find the first step that is in_progress
  const inProgressStep = steps.find(s => s.status === WorkflowStepStatus.IN_PROGRESS);
  if (inProgressStep) return inProgressStep;

  // Find the first step that is pending
  for (const stepType of WORKFLOW_STEPS_ORDER) {
    const step = steps.find(s => s.stepType === stepType);
    if (step && step.status === WorkflowStepStatus.PENDING) {
      return step;
    }
  }

  // All steps are completed or blocked, return the last one
  return steps[steps.length - 1];
}

// Helper to calculate feature progress
export function calculateFeatureProgress(steps: WorkflowStep[]): number {
  if (steps.length === 0) return 0;
  const completedSteps = steps.filter(s => s.status === WorkflowStepStatus.COMPLETED).length;
  return Math.round((completedSteps / steps.length) * 100);
}
