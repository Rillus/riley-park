/**
 * Types for Pull Request Management
 */

import { z } from 'zod';

// PR Status enum
export const PRStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  MERGED: 'merged',
  CLOSED: 'closed',
} as const;

export type PRStatus = (typeof PRStatus)[keyof typeof PRStatus];

// Zod schemas for validation
export const createPullRequestSchema = z.object({
  featureId: z.string().min(1, 'Feature ID is required'),
  workflowStepId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  prUrl: z.string().url('PR URL must be a valid URL'),
  prNumber: z.number().int().positive().optional().nullable(),
  prTitle: z.string().min(1, 'PR title is required'),
  branchName: z.string().optional().nullable(),
  status: z.enum(['draft', 'open', 'merged', 'closed']).optional().default('open'),
  githubPrId: z.string().optional().nullable(),
});

export const updatePullRequestSchema = z.object({
  prTitle: z.string().min(1, 'PR title is required').optional(),
  branchName: z.string().optional().nullable(),
  status: z.enum(['draft', 'open', 'merged', 'closed']).optional(),
  githubPrId: z.string().optional().nullable(),
});

export type CreatePullRequestInput = z.infer<typeof createPullRequestSchema>;
export type UpdatePullRequestInput = z.infer<typeof updatePullRequestSchema>;

// PullRequest type matching the database model
export interface PullRequest {
  id: string;
  featureId: string;
  workflowStepId: string | null;
  agentId: string | null;
  prUrl: string;
  prNumber: number | null;
  prTitle: string;
  branchName: string | null;
  status: PRStatus;
  githubPrId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// PullRequest with relations
export interface PullRequestWithRelations extends PullRequest {
  feature: {
    id: string;
    title: string;
    projectId: string;
  };
  workflowStep?: {
    id: string;
    stepType: string;
    stepOrder: number;
  } | null;
}

// PullRequest with project info
export interface PullRequestWithProject extends PullRequestWithRelations {
  feature: {
    id: string;
    title: string;
    projectId: string;
    project: {
      id: string;
      name: string;
    };
  };
}

// API response types
export interface PullRequestListResponse {
  pullRequests: PullRequestWithRelations[];
  total: number;
}

export interface PullRequestResponse {
  pullRequest: PullRequestWithRelations;
}

export interface PullRequestErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Extract PR information from a GitHub PR URL
 * Supports formats:
 * - https://github.com/owner/repo/pull/123
 * - https://github.com/owner/repo/pull/123/files
 */
export function parseGitHubPRUrl(url: string): {
  owner: string;
  repo: string;
  prNumber: number;
} | null {
  try {
    const urlObj = new URL(url);
    
    // Match GitHub PR URL pattern: /owner/repo/pull/123
    const match = urlObj.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) {
      return null;
    }

    const [, owner, repo, prNumberStr] = match;
    const prNumber = parseInt(prNumberStr, 10);
    
    if (isNaN(prNumber)) {
      return null;
    }

    return { owner, repo, prNumber };
  } catch {
    return null;
  }
}

/**
 * Extract branch name from PR URL or other sources
 * This is a placeholder - in a real implementation, you might need to
 * fetch this from GitHub API or parse it from the conversation
 */
export function extractBranchName(prUrl: string, prTitle?: string): string | null {
  // Try to extract from PR title if it contains branch info
  if (prTitle) {
    // Match "branch: name" or "branch name" (case insensitive)
    // Capture everything after "branch:" or "branch " until whitespace or end
    const branchMatch = prTitle.match(/branch[:\s]+([^\s\)]+)/i);
    if (branchMatch) {
      return branchMatch[1];
    }
  }
  
  // Could also try to extract from URL if it contains branch info
  // For now, return null - will need to be populated from GitHub API or conversation
  return null;
}

