/**
 * Project API Client
 * 
 * Client-side functions for interacting with the Projects API
 */

import { Project, CreateProjectInput, UpdateProjectInput, ProjectListResponse } from './types';

const API_BASE = '/api/projects';

/**
 * Fetch all projects, optionally filtered by search term
 */
export async function fetchProjects(search?: string): Promise<ProjectListResponse> {
  const url = new URL(API_BASE, window.location.origin);
  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch projects' }));
    throw new Error(error.error || 'Failed to fetch projects');
  }

  return response.json();
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch project' }));
    throw new Error(error.error || 'Failed to fetch project');
  }

  const data = await response.json();
  return data.project;
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create project' }));
    throw new Error(error.error || 'Failed to create project');
  }

  const data = await response.json();
  return data.project;
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update project' }));
    throw new Error(error.error || 'Failed to update project');
  }

  const data = await response.json();
  return data.project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete project' }));
    throw new Error(error.error || 'Failed to delete project');
  }
}
