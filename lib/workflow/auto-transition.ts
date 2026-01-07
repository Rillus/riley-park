/**
 * Auto-Transition Logic
 * Handles automatic transition to next workflow step
 */

import { prisma } from '@/lib/db';
import { CursorAPIClient } from '@/lib/cursor-api';
import {
  WorkflowStepData,
  FeatureData,
  WorkflowSettingsData,
  WorkflowStepType,
  WORKFLOW_STEP_LABELS,
  DEFAULT_POLLING_INTERVAL,
} from './types';

/**
 * Auto-transition result
 */
export interface AutoTransitionResult {
  success: boolean;
  agentId?: string;
  error?: string;
}

/**
 * Check if auto-transition should occur
 */
export async function shouldAutoTransition(
  completedStep: WorkflowStepData,
  nextStep: WorkflowStepData | null,
  allSteps: WorkflowStepData[]
): Promise<boolean> {
  // No next step means workflow is complete
  if (!nextStep) {
    return false;
  }

  // Next step must be pending
  if (nextStep.status !== 'pending') {
    return false;
  }

  // Check if auto-transition is enabled
  const settings = await getWorkflowSettings();
  if (!settings.autoTransition) {
    return false;
  }

  // Validate previous step has valid output
  if (!validatePreviousStepOutput(completedStep.output, completedStep.stepType)) {
    return false;
  }

  return true;
}

/**
 * Execute auto-transition to next step
 */
export async function executeAutoTransition(
  client: CursorAPIClient,
  feature: FeatureData,
  nextStep: WorkflowStepData,
  previousOutput: string,
  repositoryUrl: string,
  branch?: string
): Promise<AutoTransitionResult> {
  try {
    // Generate prompt for next step
    const prompt = getAutoTransitionPrompt(feature, nextStep.stepType, previousOutput);

    // Launch agent for next step
    const response = await client.launchAgent({
      repository: repositoryUrl,
      branch,
      prompt,
      autoCreatePR: nextStep.stepType === 'submit',
    });

    // Update step status to in_progress
    await prisma.workflowStep.update({
      where: { id: nextStep.id },
      data: {
        status: 'in_progress',
        agentId: response.id,
      },
    });

    // Create notification for auto-transition
    await prisma.notification.create({
      data: {
        type: 'step_started',
        title: `${WORKFLOW_STEP_LABELS[nextStep.stepType]} Started`,
        message: `Auto-transitioning to ${WORKFLOW_STEP_LABELS[nextStep.stepType].toLowerCase()} step for "${feature.title}".`,
        featureId: feature.id,
        stepId: nextStep.id,
        agentId: response.id,
        read: false,
        actionUrl: `/features/${feature.id}`,
        actionLabel: 'View Progress',
      },
    });

    return {
      success: true,
      agentId: response.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to auto-transition: ${errorMessage}`,
    };
  }
}

/**
 * Generate prompt for auto-transition based on step type
 */
export function getAutoTransitionPrompt(
  feature: FeatureData,
  stepType: WorkflowStepType,
  previousOutput: string
): string {
  const baseContext = `
Feature: ${feature.title}
Description: ${feature.description}

Previous Step Output:
${previousOutput}
`.trim();

  switch (stepType) {
    case 'spec':
      return `
Create a detailed specification document for the following feature:

${feature.title}
${feature.description}

Include:
- Overview
- Requirements (functional and non-functional)
- Acceptance criteria
- Out of scope items
- Dependencies
`.trim();

    case 'design':
      return `
Create a technical design document based on the following specification:

${baseContext}

Include:
- Architecture overview
- Component design
- API design (if applicable)
- Database schema (if applicable)
- Data flow diagrams
- Technology choices and rationale
`.trim();

    case 'implement':
      return `
Implement the feature based on the following design:

${baseContext}

Requirements:
- Follow the design document
- Write clean, maintainable code
- Include inline documentation
- Follow project coding standards
`.trim();

    case 'review':
      return `
Review the implementation of the following feature:

${baseContext}

Check for:
- Code quality and readability
- Potential bugs or issues
- Security vulnerabilities
- Performance concerns
- Test coverage
- Documentation completeness
`.trim();

    case 'test':
      return `
Test the implementation of the following feature:

${baseContext}

Run:
- Unit tests
- Integration tests
- Edge case testing
- Report test results and coverage
`.trim();

    case 'submit':
      return `
Finalise and submit the PR for the following feature:

${baseContext}

Tasks:
- Ensure all tests pass
- Update documentation
- Create/update PR description
- Mark PR as ready for review
`.trim();

    default:
      return `
Continue working on the ${stepType} step for:

${baseContext}
`.trim();
  }
}

/**
 * Validate previous step output is sufficient for transition
 */
export function validatePreviousStepOutput(
  output: string | null,
  stepType: WorkflowStepType
): boolean {
  if (!output || output.trim() === '') {
    return false;
  }

  // Step-specific validation
  switch (stepType) {
    case 'spec':
      // Spec should have requirements or overview section
      return (
        output.toLowerCase().includes('requirement') ||
        output.toLowerCase().includes('overview') ||
        output.includes('##')
      );

    case 'design':
      // Design should have architecture or component section
      return (
        output.toLowerCase().includes('architecture') ||
        output.toLowerCase().includes('component') ||
        output.toLowerCase().includes('design') ||
        output.includes('##')
      );

    case 'implement':
      // Implementation should indicate completion or PR
      return (
        output.toLowerCase().includes('implement') ||
        output.toLowerCase().includes('complete') ||
        output.toLowerCase().includes('pr') ||
        output.toLowerCase().includes('pull request')
      );

    case 'review':
      // Review should have feedback or approval
      return (
        output.toLowerCase().includes('review') ||
        output.toLowerCase().includes('approved') ||
        output.toLowerCase().includes('changes')
      );

    case 'test':
      // Test should have results
      return (
        output.toLowerCase().includes('test') ||
        output.toLowerCase().includes('pass') ||
        output.toLowerCase().includes('coverage')
      );

    case 'submit':
      // Submit should indicate PR status
      return (
        output.toLowerCase().includes('pr') ||
        output.toLowerCase().includes('merge') ||
        output.toLowerCase().includes('submit')
      );

    default:
      // For unknown step types, just check output exists
      return true;
  }
}

/**
 * Get workflow settings from database
 */
export async function getWorkflowSettings(): Promise<WorkflowSettingsData> {
  const settings = await prisma.workflowSettings.findFirst();

  if (!settings) {
    return {
      id: 'default',
      autoTransition: false,
      pollingInterval: DEFAULT_POLLING_INTERVAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return {
    id: settings.id,
    autoTransition: settings.autoTransition,
    pollingInterval: settings.pollingInterval,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

/**
 * Update workflow settings
 */
export async function updateWorkflowSettings(
  settings: Partial<Pick<WorkflowSettingsData, 'autoTransition' | 'pollingInterval'>>
): Promise<WorkflowSettingsData> {
  const updated = await prisma.workflowSettings.upsert({
    where: { id: 'default' },
    update: settings,
    create: {
      id: 'default',
      autoTransition: settings.autoTransition ?? false,
      pollingInterval: settings.pollingInterval ?? DEFAULT_POLLING_INTERVAL,
    },
  });

  return {
    id: updated.id,
    autoTransition: updated.autoTransition,
    pollingInterval: updated.pollingInterval,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}
