/**
 * Workflow Step API
 * GET /api/workflow/steps/:id - Get workflow step details
 * PUT /api/workflow/steps/:id - Update workflow step
 * POST /api/workflow/steps/:id/complete - Manually complete step
 * POST /api/workflow/steps/:id/launch - Launch agent for step
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CursorAPIClient } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';
import {
  WorkflowStepData,
  FeatureData,
  isValidStepStatus,
} from '@/lib/workflow/types';
import {
  canExecuteStep,
  canManuallyCompleteStep,
} from '@/lib/workflow/state-management';
import {
  handleStepCompletion,
  markStepInProgress,
  markStepBlocked,
  resetStepToPending,
} from '@/lib/workflow/completion-handler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const step = await prisma.workflowStep.findUnique({
      where: { id },
      include: {
        feature: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json(
        { error: 'Workflow step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ step });
  } catch (error) {
    console.error('Error fetching workflow step:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow step' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, output, agentId } = body;

    // Verify step exists
    const existing = await prisma.workflowStep.findUnique({
      where: { id },
      include: {
        feature: {
          include: {
            workflowSteps: {
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow step not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status !== undefined && isValidStepStatus(status)) {
      updateData.status = status;
    }
    if (output !== undefined) {
      updateData.output = output;
    }
    if (agentId !== undefined) {
      updateData.agentId = agentId;
    }

    const step = await prisma.workflowStep.update({
      where: { id },
      data: updateData,
      include: {
        feature: {
          include: {
            project: true,
          },
        },
      },
    });

    return NextResponse.json({ step });
  } catch (error) {
    console.error('Error updating workflow step:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow step' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Fetch step with feature and all workflow steps
    const step = await prisma.workflowStep.findUnique({
      where: { id },
      include: {
        feature: {
          include: {
            workflowSteps: {
              orderBy: { stepOrder: 'asc' },
            },
            project: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json(
        { error: 'Workflow step not found' },
        { status: 404 }
      );
    }

    // Map to typed data
    const allSteps: WorkflowStepData[] = step.feature.workflowSteps.map((s) => ({
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

    const currentStep = allSteps.find((s) => s.id === id)!;
    const featureData: FeatureData = {
      id: step.feature.id,
      projectId: step.feature.projectId,
      title: step.feature.title,
      description: step.feature.description,
      priority: step.feature.priority as FeatureData['priority'],
      status: step.feature.status as FeatureData['status'],
      createdAt: step.feature.createdAt,
      updatedAt: step.feature.updatedAt,
    };

    switch (action) {
      case 'complete': {
        // Manual completion
        if (!canManuallyCompleteStep(allSteps, currentStep.stepType)) {
          return NextResponse.json(
            { error: 'Cannot complete this step - previous steps not completed' },
            { status: 400 }
          );
        }

        const body = await request.json().catch(() => ({}));
        const result = await handleStepCompletion({
          step: currentStep,
          feature: featureData,
          allSteps,
          conversation: [],
          validateState: false,
        });

        if (body.output) {
          await prisma.workflowStep.update({
            where: { id },
            data: { output: body.output },
          });
        }

        return NextResponse.json({ success: result.success, result });
      }

      case 'launch': {
        // Launch agent for step
        const body = await request.json();
        const { prompt, apiKey: providedApiKey } = body;

        if (!prompt || typeof prompt !== 'string') {
          return NextResponse.json(
            { error: 'Prompt is required' },
            { status: 400 }
          );
        }

        // Check if step can be executed
        const isRerun = currentStep.status === 'completed' || currentStep.status === 'blocked';
        if (!canExecuteStep(allSteps, currentStep.stepType, isRerun)) {
          return NextResponse.json(
            { error: 'Cannot execute this step - workflow validation failed' },
            { status: 400 }
          );
        }

        // Get API key
        const apiKey = providedApiKey || getApiKey();
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key is required' },
            { status: 400 }
          );
        }

        try {
          const client = new CursorAPIClient(apiKey);
          const response = await client.launchAgent({
            repository: step.feature.project.repositoryUrl,
            branch: step.feature.project.defaultBranch,
            prompt,
          });

          // Update step status
          await markStepInProgress(id, response.id);

          // Update feature status if needed
          if (featureData.status === 'planned') {
            await prisma.feature.update({
              where: { id: featureData.id },
              data: { status: 'in_progress' },
            });
          }

          return NextResponse.json({
            success: true,
            agentId: response.id,
            status: response.status,
          });
        } catch (error) {
          console.error('Error launching agent:', error);
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to launch agent' },
            { status: 500 }
          );
        }
      }

      case 'block': {
        // Mark step as blocked
        const body = await request.json().catch(() => ({}));
        await markStepBlocked(id, body.reason);
        return NextResponse.json({ success: true });
      }

      case 'reset': {
        // Reset step to pending
        await resetStepToPending(id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use complete, launch, block, or reset' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing workflow step action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
