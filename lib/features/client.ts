/**
 * Feature Management Client
 * 
 * Client functions for interacting with the features API.
 */

import {
  Feature,
  FeatureWithWorkflow,
  FeatureFull,
  CreateFeatureInput,
  UpdateFeatureInput,
  WorkflowStep,
  UpdateWorkflowStepInput,
} from './types';

/**
 * Fetch all features for a project
 */
export async function fetchProjectFeatures(projectId: string): Promise<Feature[]> {
  const response = await fetch(`/api/projects/${projectId}/features`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch features' }));
    throw new Error(error.error || 'Failed to fetch features');
  }
  
  const data = await response.json();
  return data.features;
}

/**
 * Fetch a single feature with workflow steps
 */
export async function fetchFeature(featureId: string): Promise<FeatureWithWorkflow> {
  const response = await fetch(`/api/features/${featureId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch feature' }));
    throw new Error(error.error || 'Failed to fetch feature');
  }
  
  const data = await response.json();
  return data.feature;
}

/**
 * Fetch a feature with full details including project
 */
export async function fetchFeatureFull(featureId: string): Promise<FeatureFull> {
  const response = await fetch(`/api/features/${featureId}?include=project`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch feature' }));
    throw new Error(error.error || 'Failed to fetch feature');
  }
  
  const data = await response.json();
  return data.feature;
}

/**
 * Create a new feature
 */
export async function createFeature(input: CreateFeatureInput): Promise<FeatureWithWorkflow> {
  const response = await fetch('/api/features', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create feature' }));
    throw new Error(error.error || 'Failed to create feature');
  }
  
  const data = await response.json();
  return data.feature;
}

/**
 * Update an existing feature
 */
export async function updateFeature(
  featureId: string,
  input: UpdateFeatureInput
): Promise<FeatureWithWorkflow> {
  const response = await fetch(`/api/features/${featureId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update feature' }));
    throw new Error(error.error || 'Failed to update feature');
  }
  
  const data = await response.json();
  return data.feature;
}

/**
 * Delete a feature
 */
export async function deleteFeature(featureId: string): Promise<void> {
  const response = await fetch(`/api/features/${featureId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete feature' }));
    throw new Error(error.error || 'Failed to delete feature');
  }
}

/**
 * Update a workflow step
 */
export async function updateWorkflowStep(
  stepId: string,
  input: UpdateWorkflowStepInput
): Promise<WorkflowStep> {
  const response = await fetch(`/api/workflow-steps/${stepId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update workflow step' }));
    throw new Error(error.error || 'Failed to update workflow step');
  }
  
  const data = await response.json();
  return data.workflowStep;
}

/**
 * Assign an agent to a workflow step and mark it as in_progress
 */
export async function assignAgentToStep(
  stepId: string,
  agentId: string
): Promise<WorkflowStep> {
  return updateWorkflowStep(stepId, {
    agentId,
    status: 'in_progress',
  });
}

/**
 * Mark a workflow step as complete
 */
export async function completeWorkflowStep(
  stepId: string,
  output?: string
): Promise<WorkflowStep> {
  return updateWorkflowStep(stepId, {
    status: 'completed',
    output: output ?? null,
  });
}
