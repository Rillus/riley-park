/**
 * Client utilities for Shortcuts API
 */

import { Shortcut, ShortcutListResponse, ShortcutResponse, ExpandedShortcutResponse, CreateShortcutInput, UpdateShortcutInput, ExpandShortcutInput } from './types';

const API_BASE = '/api/shortcuts';

/**
 * Fetch all shortcuts with optional filters
 */
export async function fetchShortcuts(options?: {
  category?: string;
  isPredefined?: boolean;
  search?: string;
}): Promise<ShortcutListResponse> {
  const params = new URLSearchParams();
  if (options?.category) params.append('category', options.category);
  if (options?.isPredefined !== undefined) params.append('isPredefined', String(options.isPredefined));
  if (options?.search) params.append('search', options.search);

  const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch shortcuts');
  }

  return response.json();
}

/**
 * Fetch a single shortcut by ID
 */
export async function fetchShortcut(id: string): Promise<Shortcut> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Shortcut not found');
    }
    throw new Error('Failed to fetch shortcut');
  }

  const data: ShortcutResponse = await response.json();
  return data.shortcut;
}

/**
 * Create a new shortcut
 */
export async function createShortcut(input: CreateShortcutInput): Promise<Shortcut> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create shortcut');
  }

  const data: ShortcutResponse = await response.json();
  return data.shortcut;
}

/**
 * Update a shortcut
 */
export async function updateShortcut(id: string, input: UpdateShortcutInput): Promise<Shortcut> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update shortcut');
  }

  const data: ShortcutResponse = await response.json();
  return data.shortcut;
}

/**
 * Delete a shortcut
 */
export async function deleteShortcut(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete shortcut');
  }
}

/**
 * Expand a shortcut with variables
 */
export async function expandShortcut(id: string, variables: ExpandShortcutInput): Promise<string> {
  const response = await fetch(`${API_BASE}/${id}/expand`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(variables),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to expand shortcut');
  }

  const data: ExpandedShortcutResponse = await response.json();
  return data.expandedPrompt;
}

