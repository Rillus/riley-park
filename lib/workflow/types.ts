/**
 * Workflow Automation Types
 * Types and constants for the workflow automation system
 */

import { AgentStatus } from '@/lib/cursor-api/types';

/**
 * Workflow step types in order of execution
 */
export const WORKFLOW_STEP_TYPES = [
  'spec',
  'design',
  'implement',
  'review',
  'test',
  'submit',
] as const;

export type WorkflowStepType = (typeof WORKFLOW_STEP_TYPES)[number];

/**
 * Human-readable labels for workflow step types
 */
export const WORKFLOW_STEP_LABELS: Record<WorkflowStepType, string> = {
  spec: 'Specification',
  design: 'Design',
  implement: 'Implementation',
  review: 'Review',
  test: 'Testing',
  submit: 'Submit',
};

/**
 * Workflow step status
 */
export const WORKFLOW_STEP_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'blocked',
] as const;

export type WorkflowStepStatus = (typeof WORKFLOW_STEP_STATUSES)[number];

/**
 * Feature status
 */
export const FEATURE_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'blocked',
] as const;

export type FeatureStatus = (typeof FEATURE_STATUSES)[number];

/**
 * Feature priority
 */
export const FEATURE_PRIORITIES = ['high', 'medium', 'low'] as const;

export type FeaturePriority = (typeof FEATURE_PRIORITIES)[number];

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = [
  'step_completed',
  'step_failed',
  'workflow_completed',
  'step_started',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Workflow step data with agent information
 */
export interface WorkflowStepData {
  id: string;
  featureId: string;
  stepType: WorkflowStepType;
  stepOrder: number;
  status: WorkflowStepStatus;
  agentId: string | null;
  output: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feature data
 */
export interface FeatureData {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: FeaturePriority;
  status: FeatureStatus;
  createdAt: Date;
  updatedAt: Date;
  workflowSteps?: WorkflowStepData[];
}

/**
 * Notification data
 */
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  featureId: string | null;
  stepId: string | null;
  agentId: string | null;
  read: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: Date;
}

/**
 * Workflow settings
 */
export interface WorkflowSettingsData {
  id: string;
  autoTransition: boolean;
  pollingInterval: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent status change event
 */
export interface AgentStatusChangeEvent {
  agentId: string;
  previousStatus: AgentStatus;
  newStatus: AgentStatus;
  workflowStep: WorkflowStepData;
  feature: FeatureData;
}

/**
 * Step completion result
 */
export interface StepCompletionResult {
  success: boolean;
  stepId: string;
  output: string | null;
  nextStep: WorkflowStepData | null;
  notification: NotificationData | null;
  error?: string;
}

/**
 * Workflow validation result
 */
export interface WorkflowValidationResult {
  valid: boolean;
  canExecute: boolean;
  currentStep: WorkflowStepData | null;
  blockedReason?: string;
}

/**
 * Output extraction result
 */
export interface OutputExtractionResult {
  success: boolean;
  output: string | null;
  metadata?: {
    prUrl?: string;
    documentTitle?: string;
    reviewComments?: string[];
  };
}

/**
 * Default polling interval in milliseconds
 */
export const DEFAULT_POLLING_INTERVAL = 5000;

/**
 * Maximum polling interval in milliseconds
 */
export const MAX_POLLING_INTERVAL = 30000;

/**
 * Minimum polling interval in milliseconds
 */
export const MIN_POLLING_INTERVAL = 1000;

/**
 * Get step order from step type
 */
export function getStepOrder(stepType: WorkflowStepType): number {
  return WORKFLOW_STEP_TYPES.indexOf(stepType) + 1;
}

/**
 * Get step type from step order
 */
export function getStepType(stepOrder: number): WorkflowStepType | null {
  if (stepOrder < 1 || stepOrder > WORKFLOW_STEP_TYPES.length) {
    return null;
  }
  return WORKFLOW_STEP_TYPES[stepOrder - 1];
}

/**
 * Check if a step type is valid
 */
export function isValidStepType(stepType: string): stepType is WorkflowStepType {
  return WORKFLOW_STEP_TYPES.includes(stepType as WorkflowStepType);
}

/**
 * Check if a step status is valid
 */
export function isValidStepStatus(status: string): status is WorkflowStepStatus {
  return WORKFLOW_STEP_STATUSES.includes(status as WorkflowStepStatus);
}

/**
 * Check if a feature status is valid
 */
export function isValidFeatureStatus(status: string): status is FeatureStatus {
  return FEATURE_STATUSES.includes(status as FeatureStatus);
}

/**
 * Check if a feature priority is valid
 */
export function isValidFeaturePriority(priority: string): priority is FeaturePriority {
  return FEATURE_PRIORITIES.includes(priority as FeaturePriority);
}
