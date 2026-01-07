/**
 * Agent Launch Integration Module
 * 
 * Provides utilities for launching Cursor agents from projects and features.
 */

export { generateBranchName, slugify } from './branch-name';
export type { BranchNameOptions } from './branch-name';

export {
  generateStepPrompt,
  getPromptTemplate,
  getWorkflowStepLabel,
  WORKFLOW_STEP_TYPES,
} from './prompt-templates';
export type { WorkflowStepType, StepPromptOptions } from './prompt-templates';
