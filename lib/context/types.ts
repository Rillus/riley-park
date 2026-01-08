/**
 * Context Management Types
 * 
 * Types for project and feature context management
 */

import { z } from 'zod';

/**
 * Context type for feature context
 */
export const FEATURE_CONTEXT_TYPES = [
  'description',
  'spec',
  'design',
  'notes',
  'feedback',
] as const;

export type FeatureContextType = (typeof FEATURE_CONTEXT_TYPES)[number];

/**
 * Project context data
 */
export interface ProjectContext {
  id: string;
  projectId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feature context data
 */
export interface FeatureContext {
  id: string;
  featureId: string;
  content: string;
  contextType: FeatureContextType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create project context input
 */
export const createProjectContextSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export type CreateProjectContextInput = z.infer<typeof createProjectContextSchema>;

/**
 * Update project context input
 */
export const updateProjectContextSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export type UpdateProjectContextInput = z.infer<typeof updateProjectContextSchema>;

/**
 * Create feature context input
 */
export const createFeatureContextSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  contextType: z.enum(FEATURE_CONTEXT_TYPES as [string, ...string[]]),
});

export type CreateFeatureContextInput = z.infer<typeof createFeatureContextSchema>;

/**
 * Update feature context input
 */
export const updateFeatureContextSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export type UpdateFeatureContextInput = z.infer<typeof updateFeatureContextSchema>;

/**
 * Feature context grouped by type
 */
export interface FeatureContextGrouped {
  description?: FeatureContext;
  spec?: FeatureContext;
  design?: FeatureContext;
  notes: FeatureContext[];
  feedback: FeatureContext[];
}

/**
 * Context prompt generation options
 */
export interface ContextPromptOptions {
  projectId?: string;
  featureId?: string;
  includeProjectContext?: boolean;
  includeFeatureContext?: boolean;
  includeContextTypes?: FeatureContextType[];
  maxTokens?: number;
}

/**
 * Context prompt result
 */
export interface ContextPromptResult {
  prompt: string;
  tokenEstimate: number;
  truncated: boolean;
  warning?: string;
}

