/**
 * Feature Workflow API
 * GET /api/features/:id/workflow - Get workflow steps for a feature
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  validateWorkflowState,
  getWorkflowProgress,
  getCurrentStep,
  getReadySteps,
} from '@/lib/workflow/state-management';
import { WorkflowStepData } from '@/lib/workflow/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const feature = await prisma.feature.findUnique({
      where: { id },
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

    // Map to WorkflowStepData type
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
      featureId: id,
      steps,
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
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}
