/**
 * API Routes for Feature Workflow Steps
 * 
 * GET /api/features/:id/workflow - Get workflow steps for a feature with state info
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  validateWorkflowState,
  getWorkflowProgress,
  getCurrentStep,
  getReadySteps,
} from '@/lib/workflow/state-management';
import { WorkflowStepData } from '@/lib/workflow/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/features/:id/workflow
 * Get all workflow steps for a feature with workflow state information
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: featureId } = await params;

    // Check if feature exists and get workflow steps
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        workflowSteps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Map to WorkflowStepData type for state management functions
    const steps: WorkflowStepData[] = feature.workflowSteps.map((s) => ({
      id: s.id,
      featureId: s.featureId,
      stepType: s.stepType as WorkflowStepData['stepType'],
      stepOrder: s.stepOrder,
      status: s.status as WorkflowStepData['status'],
      agentId: s.agentId,
      output: s.output,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    // Get workflow state info
    const validation = validateWorkflowState(steps);
    const progress = getWorkflowProgress(steps);
    const currentStep = getCurrentStep(steps);
    const readySteps = getReadySteps(steps);

    return NextResponse.json({
      featureId,
      workflowSteps: steps,
      state: {
        valid: validation.valid,
        canExecute: validation.canExecute,
        blockedReason: validation.blockedReason,
        currentStepId: currentStep?.id,
        currentStepType: currentStep?.stepType,
        readyStepIds: readySteps.map((s) => s.id),
      },
      progress,
    });
  } catch (error) {
    console.error('Error fetching workflow steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow steps' },
      { status: 500 }
    );
  }
}
