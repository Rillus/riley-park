/**
 * Types for Feature and Workflow Step Management
 */

import { z } from 'zod';
import { WORKFLOW_STEP_TYPES, WorkflowStepType } from '@/lib/agent-launch';

// Feature priority values
export const FEATURE_PRIORITIES = ['high', 'medium', 'low'] as const;
export type FeaturePriority = (typeof FEATURE_PRIORITIES)[number];

// Feature status values
export const FEATURE_STATUSES = ['planned', 'in_progress', 'completed', 'blocked'] as const;
export type FeatureStatus = (typeof FEATURE_STATUSES)[number];

// Workflow step status values
export const WORKFLOW_STEP_STATUSES = ['pending', 'in_progress', 'completed', 'blocked'] as const;
export type WorkflowStepStatus = (typeof WORKFLOW_STEP_STATUSES)[number];

// Re-export workflow step type from agent-launch
export { WORKFLOW_STEP_TYPES };
export type { WorkflowStepType };

// Zod schemas for validation
export const createFeatureSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Feature title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Feature description is required').max(5000, 'Description is too long'),
  priority: z.enum(FEATURE_PRIORITIES).optional().default('medium'),
});

export const updateFeatureSchema = z.object({
  title: z.string().min(1, 'Feature title is required').max(255, 'Title is too long').optional(),
  description: z.string().min(1, 'Feature description is required').max(5000, 'Description is too long').optional(),
  priority: z.enum(FEATURE_PRIORITIES).optional(),
  status: z.enum(FEATURE_STATUSES).optional(),
});

export const updateWorkflowStepSchema = z.object({
  status: z.enum(WORKFLOW_STEP_STATUSES).optional(),
  agentId: z.string().nullable().optional(),
  output: z.string().nullable().optional(),
});

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
export type UpdateWorkflowStepInput = z.infer<typeof updateWorkflowStepSchema>;

// WorkflowStep type matching the database model
export interface WorkflowStep {
  id: string;
  featureId: string;
  stepType: WorkflowStepType;
  status: WorkflowStepStatus;
  agentId: string | null;
  output: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Feature type matching the database model
export interface Feature {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: FeaturePriority;
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
    repositoryUrl: string;
    defaultBranch: string;
  };
}

// Full feature including workflow steps and project
export interface FeatureFull extends FeatureWithWorkflow {
  project: {
    id: string;
    name: string;
    repositoryUrl: string;
    defaultBranch: string;
  };
}

// API response types
export interface FeatureListResponse {
  features: Feature[];
  total: number;
}

export interface FeatureResponse {
  feature: FeatureWithWorkflow;
}

export interface FeatureFullResponse {
  feature: FeatureFull;
}

export interface WorkflowStepResponse {
  workflowStep: WorkflowStep;
}

export interface FeatureErrorResponse {
  error: string;
  details?: unknown;
}
