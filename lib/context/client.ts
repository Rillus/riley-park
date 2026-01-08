/**
 * Context API Client
 * 
 * Client-side functions for interacting with the Context API
 */

import {
  ProjectContext,
  FeatureContext,
  CreateProjectContextInput,
  UpdateProjectContextInput,
  CreateFeatureContextInput,
  UpdateFeatureContextInput,
  FeatureContextGrouped,
} from './types';

const API_BASE = '/api';

/**
 * Fetch project context
 */
export async function fetchProjectContext(projectId: string): Promise<ProjectContext | null> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/context`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json().catch(() => ({ error: 'Failed to fetch project context' }));
    throw new Error(error.error || 'Failed to fetch project context');
  }

  const data = await response.json();
  return data.context;
}

/**
 * Create or update project context
 */
export async function upsertProjectContext(
  projectId: string,
  input: CreateProjectContextInput | UpdateProjectContextInput
): Promise<ProjectContext> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/context`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save project context' }));
    throw new Error(error.error || 'Failed to save project context');
  }

  const data = await response.json();
  return data.context;
}

/**
 * Fetch all feature context entries
 */
export async function fetchFeatureContexts(featureId: string): Promise<FeatureContext[]> {
  const response = await fetch(`${API_BASE}/features/${featureId}/context`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch feature context' }));
    throw new Error(error.error || 'Failed to fetch feature context');
  }

  const data = await response.json();
  return data.contexts || [];
}

/**
 * Fetch feature context grouped by type
 */
export async function fetchFeatureContextGrouped(featureId: string): Promise<FeatureContextGrouped> {
  const contexts = await fetchFeatureContexts(featureId);
  
  const grouped: FeatureContextGrouped = {
    notes: [],
    feedback: [],
  };

  for (const context of contexts) {
    if (context.contextType === 'description' || context.contextType === 'spec' || context.contextType === 'design') {
      // Only keep the most recent one for these types
      if (!grouped[context.contextType] || context.updatedAt > grouped[context.contextType]!.updatedAt) {
        grouped[context.contextType] = context;
      }
    } else {
      // For notes and feedback, keep all entries
      grouped[context.contextType].push(context);
    }
  }

  return grouped;
}

/**
 * Create feature context
 */
export async function createFeatureContext(
  featureId: string,
  input: CreateFeatureContextInput
): Promise<FeatureContext> {
  const response = await fetch(`${API_BASE}/features/${featureId}/context`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create feature context' }));
    throw new Error(error.error || 'Failed to create feature context');
  }

  const data = await response.json();
  return data.context;
}

/**
 * Update feature context
 */
export async function updateFeatureContext(
  featureId: string,
  contextId: string,
  input: UpdateFeatureContextInput
): Promise<FeatureContext> {
  const response = await fetch(`${API_BASE}/features/${featureId}/context/${contextId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update feature context' }));
    throw new Error(error.error || 'Failed to update feature context');
  }

  const data = await response.json();
  return data.context;
}

