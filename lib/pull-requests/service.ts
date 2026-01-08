/**
 * PR Service
 * Handles creating and managing PR records
 */

import { prisma } from '@/lib/db';
import { ExtractedPRInfo } from './detection';
import { PRStatus, createPullRequestSchema } from './types';

/**
 * Create a PR record from extracted PR info
 */
export async function createPRFromDetection(
  prInfo: ExtractedPRInfo,
  featureId: string,
  workflowStepId: string | null,
  agentId: string | null
): Promise<{
  id: string;
  prUrl: string;
  prNumber: number | null;
  prTitle: string;
  status: string;
}> {
  // Check if PR already exists for this feature
  const existingPR = await prisma.pullRequest.findFirst({
    where: {
      featureId,
      prUrl: prInfo.prUrl,
    },
  });

  if (existingPR) {
    // Update existing PR if needed
    const updated = await prisma.pullRequest.update({
      where: { id: existingPR.id },
      data: {
        prTitle: prInfo.prTitle || existingPR.prTitle,
        branchName: prInfo.branchName || existingPR.branchName,
        workflowStepId: workflowStepId || existingPR.workflowStepId,
        agentId: agentId || existingPR.agentId,
      },
    });

    return {
      id: updated.id,
      prUrl: updated.prUrl,
      prNumber: updated.prNumber,
      prTitle: updated.prTitle,
      status: updated.status,
    };
  }

  // Create new PR record
  const pullRequest = await prisma.pullRequest.create({
    data: {
      featureId,
      workflowStepId,
      agentId,
      prUrl: prInfo.prUrl,
      prNumber: prInfo.prNumber,
      prTitle: prInfo.prTitle || `PR #${prInfo.prNumber}`,
      branchName: prInfo.branchName,
      status: PRStatus.OPEN,
    },
  });

  return {
    id: pullRequest.id,
    prUrl: pullRequest.prUrl,
    prNumber: pullRequest.prNumber,
    prTitle: pullRequest.prTitle,
    status: pullRequest.status,
  };
}

/**
 * Create PR records from detected PRs in conversation
 */
export async function createPRsFromConversation(
  prs: ExtractedPRInfo[],
  featureId: string,
  workflowStepId: string | null,
  agentId: string | null
): Promise<Array<{ id: string; prUrl: string; prNumber: number | null; prTitle: string; status: string }>> {
  const results = [];

  for (const prInfo of prs) {
    try {
      const pr = await createPRFromDetection(prInfo, featureId, workflowStepId, agentId);
      results.push(pr);
    } catch (error) {
      console.error(`Failed to create PR record for ${prInfo.prUrl}:`, error);
      // Continue with other PRs even if one fails
    }
  }

  return results;
}

/**
 * Update PR status
 */
export async function updatePRStatus(
  prId: string,
  status: PRStatus
): Promise<void> {
  await prisma.pullRequest.update({
    where: { id: prId },
    data: { status },
  });
}

/**
 * Get PRs for a feature
 */
export async function getPRsForFeature(featureId: string) {
  return prisma.pullRequest.findMany({
    where: { featureId },
    include: {
      workflowStep: {
        select: {
          id: true,
          stepType: true,
          stepOrder: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get PRs for a workflow step
 */
export async function getPRsForWorkflowStep(workflowStepId: string) {
  return prisma.pullRequest.findMany({
    where: { workflowStepId },
    include: {
      feature: {
        select: {
          id: true,
          title: true,
          projectId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

