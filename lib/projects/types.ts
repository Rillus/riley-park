/**
 * Types for Project Management
 */

import { z } from 'zod';

// Repository URL validation regex - supports GitHub, GitLab, Bitbucket, and generic git URLs
const repositoryUrlRegex = /^(https?:\/\/)?([\w-]+@)?(github\.com|gitlab\.com|bitbucket\.org|[\w.-]+)(\/[\w.-]+){1,}(\.git)?$/i;

// Zod schemas for validation
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long'),
  repositoryUrl: z
    .string()
    .min(1, 'Repository URL is required')
    .regex(repositoryUrlRegex, 'Invalid repository URL format'),
  defaultBranch: z.string().optional().default('main'),
  description: z.string().max(2000, 'Description is too long').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long').optional(),
  repositoryUrl: z
    .string()
    .min(1, 'Repository URL is required')
    .regex(repositoryUrlRegex, 'Invalid repository URL format')
    .optional(),
  defaultBranch: z.string().optional(),
  description: z.string().max(2000, 'Description is too long').optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Project type matching the database model
export interface Project {
  id: string;
  name: string;
  repositoryUrl: string;
  defaultBranch: string;
  description: string | null;
  lastSyncedAt: Date | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Project with computed fields for display
export interface ProjectWithStats extends Project {
  activeAgentsCount?: number;
  featuresInProgressCount?: number;
  lastActivity?: Date;
}

// API response types
export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface ProjectResponse {
  project: Project;
}

export interface ProjectErrorResponse {
  error: string;
  details?: unknown;
}
