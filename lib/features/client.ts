/**
 * Feature API Client
 * 
 * Client-side functions for interacting with the Features API
 */

import {
  FeatureWithWorkflow,
  WorkflowStep,
  CreateFeatureInput,
  UpdateFeatureInput,
  UpdateWorkflowStepInput,
} from './types';

const FEATURES_API = '/api/features';
const WORKFLOW_STEPS_API = '/api/workflow-steps';
const PROJECTS_API = '/api/projects';

export interface FetchFeaturesOptions {
  status?: string;
  priority?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface FeaturesListResponse {
  features: FeatureWithWorkflow[];
  total: number;
}

/**
 * Fetch all features for a project, optionally filtered
 */
export async function fetchFeatures(
  projectId: string,
  options: FetchFeaturesOptions = {}
): Promise<FeaturesListResponse> {
  const url = new URL(`/api/projects/${projectId}/features`, window.location.origin);
  
  if (options.status) url.searchParams.set('status', options.status);
  if (options.priority) url.searchParams.set('priority', options.priority);
  if (options.sortBy) url.searchParams.set('sortBy', options.sortBy);
  if (options.sortOrder) url.searchParams.set('sortOrder', options.sortOrder);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch features' }));
    throw new Error(error.error || 'Failed to fetch features');
  }

  return response.json();
}

/**
 * Fetch a single feature by ID
 */
export async function fetchFeature(id: string): Promise<FeatureWithWorkflow & { project: { id: string; name: string; repositoryUrl: string; defaultBranch: string } }> {
  const response = await fetch(`${FEATURES_API}/${id}`);
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
  const response = await fetch(FEATURES_API, {
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
  id: string,
  input: UpdateFeatureInput
): Promise<FeatureWithWorkflow> {
  const response = await fetch(`${FEATURES_API}/${id}`, {
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
export async function deleteFeature(id: string): Promise<void> {
  const response = await fetch(`${FEATURES_API}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete feature' }));
    throw new Error(error.error || 'Failed to delete feature');
  }
}

/**
 * Fetch workflow steps for a feature
 */
export async function fetchWorkflowSteps(featureId: string): Promise<WorkflowStep[]> {
  const response = await fetch(`${FEATURES_API}/${featureId}/workflow`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch workflow steps' }));
    throw new Error(error.error || 'Failed to fetch workflow steps');
  }

  const data = await response.json();
  return data.workflowSteps;
}

/**
 * Fetch a single workflow step by ID
 */
export async function fetchWorkflowStep(id: string): Promise<WorkflowStep & { feature: { id: string; title: string; projectId: string } }> {
  const response = await fetch(`${WORKFLOW_STEPS_API}/${id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch workflow step' }));
    throw new Error(error.error || 'Failed to fetch workflow step');
  }

  const data = await response.json();
  return data.workflowStep;
}

/**
 * Update a workflow step
 */
export async function updateWorkflowStep(
  id: string,
  input: UpdateWorkflowStepInput
): Promise<WorkflowStep> {
  const response = await fetch(`${WORKFLOW_STEPS_API}/${id}`, {
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
 * Sync result from the API
 */
export interface FeatureSyncResult {
  success: boolean;
  synced: number;
  created: number;
  updated: number;
  errors: string[];
  message: string;
}

/**
 * Sync status from the API
 */
export interface FeatureSyncStatus {
  lastSyncedAt: string | null;
  lastSyncStatus: 'success' | 'error' | 'in_progress' | null;
  lastSyncError: string | null;
  hasGitHubToken: boolean;
}

/**
 * Trigger a feature sync from the project repository
 */
export async function syncFeaturesFromRepository(projectId: string): Promise<FeatureSyncResult> {
  // Get GitHub token from localStorage if available
  const { getGitHubToken } = await import('@/lib/github/storage');
  const githubToken = getGitHubToken();

  const response = await fetch(`${PROJECTS_API}/${projectId}/sync-features`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      githubToken: githubToken || undefined,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Return error result with details
    return {
      success: false,
      synced: data.synced || 0,
      created: data.created || 0,
      updated: data.updated || 0,
      errors: data.errors || [data.error || 'Failed to sync features'],
      message: data.error || 'Failed to sync features',
    };
  }

  return data;
}

/**
 * Get the sync status for a project
 */
export async function getFeatureSyncStatus(projectId: string): Promise<FeatureSyncStatus> {
  // Get GitHub token from localStorage if available
  const { getGitHubToken } = await import('@/lib/github/storage');
  const githubToken = getGitHubToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Send token in header if available
  if (githubToken) {
    headers['x-github-token'] = githubToken;
  }

  const response = await fetch(`${PROJECTS_API}/${projectId}/features/sync-status`, {
    headers,
  });
  
  if (!response.ok) {
    let errorMessage = 'Failed to fetch sync status';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Response body is not valid JSON, use default error message
      console.error('Failed to fetch sync status:', errorMessage);
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Override hasGitHubToken with client-side check for more accurate status
  return {
    ...data,
    hasGitHubToken: !!githubToken || data.hasGitHubToken,
  };
}
