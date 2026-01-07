/**
 * API Routes for Feature Management
 * 
 * GET /api/features - List all features (with optional filters)
 * POST /api/features - Create a new feature with workflow steps
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createFeatureSchema, WORKFLOW_STEPS_ORDER } from '@/lib/features/types';
import { getStepOrder } from '@/lib/workflow/types';

/**
 * GET /api/features
 * List all features with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const features = await prisma.feature.findMany({
      where,
      include: {
        workflowSteps: {
          orderBy: { stepOrder: 'asc' },
        },
        project: {
          select: {
            id: true,
            name: true,
            repositoryUrl: true,
            defaultBranch: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ features, total: features.length });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features
 * Create a new feature with workflow steps
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createFeatureSchema.safeParse(body);
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

    const { projectId, title, description, priority } = validationResult.data;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create the feature with workflow steps in a transaction
    const feature = await prisma.$transaction(async (tx) => {
      // Create the feature
      const newFeature = await tx.feature.create({
        data: {
          projectId,
          title,
          description,
          priority,
          status: 'planned',
        },
      });

      // Create workflow steps with step order
      await tx.workflowStep.createMany({
        data: WORKFLOW_STEPS_ORDER.map((stepType) => ({
          featureId: newFeature.id,
          stepType,
          stepOrder: getStepOrder(stepType),
          status: 'pending',
        })),
      });

      // Fetch the complete feature with workflow steps
      return tx.feature.findUnique({
        where: { id: newFeature.id },
        include: {
          workflowSteps: {
            orderBy: { stepOrder: 'asc' },
          },
          project: {
            select: {
              id: true,
              name: true,
              repositoryUrl: true,
              defaultBranch: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ feature }, { status: 201 });
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    );
  }
}
