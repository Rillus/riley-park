/**
 * Pull Request API Client
 * 
 * Client-side functions for interacting with the Pull Requests API
 */

import {
  PullRequestWithRelations,
  PullRequestWithProject,
  CreatePullRequestInput,
  UpdatePullRequestInput,
} from './types';

const PULL_REQUESTS_API = '/api/pull-requests';
const FEATURES_API = '/api/features';

export interface FetchPullRequestsOptions {
  featureId?: string;
  projectId?: string;
  status?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'prTitle';
  sortOrder?: 'asc' | 'desc';
}

export interface PullRequestListResponse {
  pullRequests: PullRequestWithRelations[];
  total: number;
}

/**
 * Fetch all pull requests, optionally filtered
 */
export async function fetchPullRequests(
  options: FetchPullRequestsOptions = {}
): Promise<PullRequestListResponse> {
  const url = new URL(PULL_REQUESTS_API, window.location.origin);
  
  if (options.featureId) url.searchParams.set('featureId', options.featureId);
  if (options.projectId) url.searchParams.set('projectId', options.projectId);
  if (options.status) url.searchParams.set('status', options.status);
  if (options.sortBy) url.searchParams.set('sortBy', options.sortBy);
  if (options.sortOrder) url.searchParams.set('sortOrder', options.sortOrder);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch pull requests' }));
    throw new Error(error.error || 'Failed to fetch pull requests');
  }

  return response.json();
}

/**
 * Fetch a single pull request by ID
 */
export async function fetchPullRequest(id: string): Promise<PullRequestWithProject> {
  const response = await fetch(`${PULL_REQUESTS_API}/${id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch pull request' }));
    throw new Error(error.error || 'Failed to fetch pull request');
  }

  const data = await response.json();
  return data.pullRequest;
}

/**
 * Create a new pull request record
 */
export async function createPullRequest(
  input: CreatePullRequestInput
): Promise<PullRequestWithRelations> {
  const response = await fetch(PULL_REQUESTS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create pull request' }));
    throw new Error(error.error || 'Failed to create pull request');
  }

  const data = await response.json();
  return data.pullRequest;
}

/**
 * Update an existing pull request
 */
export async function updatePullRequest(
  id: string,
  input: UpdatePullRequestInput
): Promise<PullRequestWithRelations> {
  const response = await fetch(`${PULL_REQUESTS_API}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update pull request' }));
    throw new Error(error.error || 'Failed to update pull request');
  }

  const data = await response.json();
  return data.pullRequest;
}

/**
 * Fetch pull requests for a specific feature
 */
export async function fetchFeaturePullRequests(featureId: string): Promise<PullRequestListResponse> {
  const response = await fetch(`${FEATURES_API}/${featureId}/pull-requests`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch feature pull requests' }));
    throw new Error(error.error || 'Failed to fetch feature pull requests');
  }

  return response.json();
}

