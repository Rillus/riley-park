/**
 * API Routes for Workflow Step Management
 * 
 * GET /api/workflow-steps/:id - Get workflow step details
 * PUT /api/workflow-steps/:id - Update workflow step (status, agent assignment)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateWorkflowStepSchema } from '@/lib/features/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/workflow-steps/:id
 * Get a workflow step by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const workflowStep = await prisma.workflowStep.findUnique({
      where: { id },
      include: {
        feature: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!workflowStep) {
      return NextResponse.json(
        { error: 'Workflow step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflowStep });
  } catch (error) {
    console.error('Error fetching workflow step:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow step' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflow-steps/:id
 * Update a workflow step (status, agent ID, output)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if workflow step exists
    const existingStep = await prisma.workflowStep.findUnique({
      where: { id },
    });

    if (!existingStep) {
      return NextResponse.json(
        { error: 'Workflow step not found' },
        { status: 404 }
      );
    }

    // Validate input
    const validationResult = updateWorkflowStepSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { status, agentId, output } = validationResult.data;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (agentId !== undefined) updateData.agentId = agentId;
    if (output !== undefined) updateData.output = output;

    // Update the workflow step
    const workflowStep = await prisma.workflowStep.update({
      where: { id },
      data: updateData,
    });

    // If status changed to in_progress, update feature status too
    if (status === 'in_progress') {
      await prisma.feature.update({
        where: { id: existingStep.featureId },
        data: { status: 'in_progress' },
      });
    }

    // Check if all steps are completed to update feature status
    if (status === 'completed') {
      const allSteps = await prisma.workflowStep.findMany({
        where: { featureId: existingStep.featureId },
      });
      const allCompleted = allSteps.every(step => step.status === 'completed');
      if (allCompleted) {
        await prisma.feature.update({
          where: { id: existingStep.featureId },
          data: { status: 'completed' },
        });
      }
    }

    return NextResponse.json({ workflowStep });
  } catch (error) {
    console.error('Error updating workflow step:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow step' },
      { status: 500 }
    );
  }
}
