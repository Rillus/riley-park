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
} from './client';

export type { FetchFeaturesOptions, FeaturesListResponse } from './client';

// Parser functions (for markdown feature files)
export {
  parseFeatureMetadata,
  readFeatureFiles,
  readFeatureFile,
} from './parser';

export type { FeatureMetadata } from './parser';
