/**
 * Notification Service
 * 
 * Helper functions for creating different types of notifications
 */

import { prisma } from '@/lib/db';
import { CreateNotificationInput, NotificationType, Notification } from './types';

/**
 * Transform Prisma notification to API response format
 */
function transformNotification(dbNotification: {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  metadata: string | null;
  createdAt: Date;
}): Notification {
  return {
    id: dbNotification.id,
    userId: dbNotification.userId,
    type: dbNotification.type as NotificationType,
    title: dbNotification.title,
    message: dbNotification.message,
    read: dbNotification.read,
    actionUrl: dbNotification.actionUrl,
    metadata: dbNotification.metadata
      ? (JSON.parse(dbNotification.metadata) as Record<string, unknown>)
      : null,
    createdAt: dbNotification.createdAt,
  };
}

/**
 * Create a notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      userId: input.userId,
    },
  });

  return transformNotification(notification);
}

/**
 * Notify that an agent has finished its task
 */
export async function notifyAgentFinished(
  agentId: string,
  featureId?: string
): Promise<Notification> {
  const metadata: Record<string, unknown> = { agentId };
  if (featureId) {
    metadata.featureId = featureId;
  }

  return createNotification({
    type: 'agent_finished',
    title: 'Agent Completed',
    message: `Agent ${agentId} has completed its task.`,
    actionUrl: `/agents/${agentId}/conversation`,
    metadata,
  });
}

/**
 * Notify that an agent needs user input
 */
export async function notifyAgentNeedsInput(
  agentId: string,
  featureId?: string
): Promise<Notification> {
  const metadata: Record<string, unknown> = { agentId };
  if (featureId) {
    metadata.featureId = featureId;
  }

  return createNotification({
    type: 'agent_needs_input',
    title: 'Agent Needs Input',
    message: `Agent ${agentId} is waiting for your input or clarification.`,
    actionUrl: `/agents/${agentId}/conversation`,
    metadata,
  });
}

/**
 * Notify that a PR has been created
 */
export async function notifyPRCreated(
  prUrl: string,
  featureId?: string
): Promise<Notification> {
  const metadata: Record<string, unknown> = { prUrl };
  if (featureId) {
    metadata.featureId = featureId;
  }

  return createNotification({
    type: 'pr_created',
    title: 'Pull Request Created',
    message: `A new pull request has been created: ${prUrl}`,
    actionUrl: prUrl,
    metadata,
  });
}

/**
 * Notify that a PR review is ready
 */
export async function notifyPRReviewReady(
  prUrl: string,
  featureId?: string
): Promise<Notification> {
  const metadata: Record<string, unknown> = { prUrl };
  if (featureId) {
    metadata.featureId = featureId;
  }

  return createNotification({
    type: 'pr_review_ready',
    title: 'PR Review Ready',
    message: `Pull request review is ready: ${prUrl}`,
    actionUrl: prUrl,
    metadata,
  });
}

/**
 * Notify that a workflow step has been completed
 */
export async function notifyStepComplete(
  featureId: string,
  stepId: string,
  stepName?: string
): Promise<Notification> {
  return createNotification({
    type: 'step_complete',
    title: 'Workflow Step Complete',
    message: stepName
      ? `Step "${stepName}" has been completed. Next step is ready.`
      : `Workflow step ${stepId} has been completed. Next step is ready.`,
    actionUrl: '/features',
    metadata: {
      featureId,
      stepId,
      stepName,
    },
  });
}

/**
 * Notify about an agent error
 */
export async function notifyError(
  agentId: string,
  error: Error | string
): Promise<Notification> {
  const errorMessage = error instanceof Error ? error.message : error;

  return createNotification({
    type: 'error',
    title: 'Agent Error',
    message: `Agent ${agentId} encountered an error: ${errorMessage}`,
    actionUrl: `/agents/${agentId}/conversation`,
    metadata: {
      agentId,
      errorMessage,
    },
  });
}
