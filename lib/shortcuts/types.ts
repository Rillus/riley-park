/**
 * Types for Prompt Shortcuts
 */

import { z } from 'zod';

// Zod schemas for validation
export const createShortcutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  promptTemplate: z.string().min(1, 'Prompt template is required').max(10000, 'Prompt template is too long'),
  category: z.string().max(100, 'Category is too long').nullable().optional(),
});

export const updateShortcutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  promptTemplate: z.string().min(1, 'Prompt template is required').max(10000, 'Prompt template is too long').optional(),
  category: z.string().max(100, 'Category is too long').nullable().optional(),
});

export const expandShortcutSchema = z.object({
  feature: z.string().optional(),
  project: z.string().optional(),
  step: z.string().optional(),
  description: z.string().optional(),
});

export type CreateShortcutInput = z.infer<typeof createShortcutSchema>;
export type UpdateShortcutInput = z.infer<typeof updateShortcutSchema>;
export type ExpandShortcutInput = z.infer<typeof expandShortcutSchema>;

// Shortcut type matching the database model
export interface Shortcut {
  id: string;
  name: string;
  promptTemplate: string;
  category: string | null;
  isPredefined: boolean;
  userId: string | null;
  variables: string | null; // JSON string for list of variables
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ShortcutListResponse {
  shortcuts: Shortcut[];
  total: number;
}

export interface ShortcutResponse {
  shortcut: Shortcut;
}

export interface ExpandedShortcutResponse {
  expandedPrompt: string;
}

export interface ShortcutErrorResponse {
  error: string;
  details?: unknown;
}

// Available variables for shortcuts
export const SHORTCUT_VARIABLES = {
  FEATURE: '{feature}',
  PROJECT: '{project}',
  STEP: '{step}',
  DESCRIPTION: '{description}',
} as const;

export type ShortcutVariable = (typeof SHORTCUT_VARIABLES)[keyof typeof SHORTCUT_VARIABLES];

// Pre-defined shortcuts
export const PREDEFINED_SHORTCUTS = [
  {
    name: 'Create Spec',
    promptTemplate: 'Create a detailed specification for {feature}. Include: requirements, acceptance criteria, technical constraints, user stories',
    category: 'Specification',
  },
  {
    name: 'Review PR',
    promptTemplate: 'Review this PR thoroughly. Check: code quality, adherence to requirements, test coverage, edge cases, performance, security',
    category: 'Review',
  },
  {
    name: 'Add Tests',
    promptTemplate: 'Add comprehensive tests for {feature}. Include: unit tests, integration tests, edge cases, error handling',
    category: 'Testing',
  },
  {
    name: 'Refactor',
    promptTemplate: 'Refactor this code to improve: readability, maintainability, performance, following best practices',
    category: 'Code Quality',
  },
  {
    name: 'Documentation',
    promptTemplate: 'Add/update documentation for {feature}. Include: README updates, code comments, API documentation',
    category: 'Documentation',
  },
] as const;

// Helper function to extract variables from a template
export function extractVariables(template: string): string[] {
  const variableRegex = /\{(\w+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const variableName = match[1];
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
}

