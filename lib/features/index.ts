/**
 * Feature Management Library
 * 
 * Exports types, client functions, and utilities for feature management
 */

// Types and schemas
export {
  Priority,
  FeatureStatus,
  StepType,
  WorkflowStepStatus,
  WORKFLOW_STEPS_ORDER,
  STEP_DISPLAY_NAMES,
  createFeatureSchema,
  updateFeatureSchema,
  updateWorkflowStepSchema,
  getCurrentWorkflowStep,
  calculateFeatureProgress,
} from './types';

export type {
  Feature,
  FeatureWithWorkflow,
  FeatureWithProject,
  WorkflowStep,
  CreateFeatureInput,
  UpdateFeatureInput,
  UpdateWorkflowStepInput,
  FeatureListResponse,
  FeatureResponse,
  WorkflowStepsResponse,
  FeatureErrorResponse,
} from './types';

// Client functions
export {
  fetchFeatures,
  fetchFeature,
  createFeature,
  updateFeature,
  deleteFeature,
  fetchWorkflowSteps,
  fetchWorkflowStep,
  updateWorkflowStep,
  syncFeaturesFromRepository,
  getFeatureSyncStatus,
} from './client';

export type { 
  FetchFeaturesOptions, 
  FeaturesListResponse,
  FeatureSyncResult,
  FeatureSyncStatus,
} from './client';

// Parser types (for markdown feature files)
// Note: Parser functions are server-only and should be imported directly from './parser'
// Only export the type for client-side use
export type { FeatureMetadata } from './parser';

// Sync service types (server-only - import from './sync' directly)
export type { SyncResult, SyncError } from './sync';
