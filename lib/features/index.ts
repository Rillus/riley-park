/**
 * Features Module
 * 
 * Provides feature and workflow step management.
 */

// Parser exports (for reading feature spec files)
export { parseFeatureMetadata, readFeatureFiles, readFeatureFile } from './parser';
export type { FeatureMetadata } from './parser';

// Client exports (for API interactions)
export {
  fetchProjectFeatures,
  fetchFeature,
  fetchFeatureFull,
  createFeature,
  updateFeature,
  deleteFeature,
  updateWorkflowStep,
  assignAgentToStep,
  completeWorkflowStep,
} from './client';

// Type exports
export {
  FEATURE_PRIORITIES,
  FEATURE_STATUSES,
  WORKFLOW_STEP_STATUSES,
  WORKFLOW_STEP_TYPES,
  createFeatureSchema,
  updateFeatureSchema,
  updateWorkflowStepSchema,
} from './types';

export type {
  Feature,
  FeatureWithWorkflow,
  FeatureWithProject,
  FeatureFull,
  FeaturePriority,
  FeatureStatus,
  WorkflowStep,
  WorkflowStepType,
  WorkflowStepStatus,
  CreateFeatureInput,
  UpdateFeatureInput,
  UpdateWorkflowStepInput,
  FeatureListResponse,
  FeatureResponse,
  FeatureFullResponse,
  WorkflowStepResponse,
  FeatureErrorResponse,
} from './types';
