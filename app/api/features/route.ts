/**
 * Features API
 * GET /api/features - List all features
 * POST /api/features - Create a new feature with workflow steps
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { WORKFLOW_STEP_TYPES, getStepOrder, isValidFeaturePriority, isValidFeatureStatus } from '@/lib/workflow/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status && isValidFeatureStatus(status)) where.status = status;
    if (priority && isValidFeaturePriority(priority)) where.priority = priority;

    const features = await prisma.feature.findMany({
      where,
      include: {
        workflowSteps: {
          orderBy: { stepOrder: 'asc' },
        },
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, projectId, priority = 'medium' } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create feature with workflow steps
    const feature = await prisma.feature.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        projectId,
        priority: isValidFeaturePriority(priority) ? priority : 'medium',
        status: 'planned',
        workflowSteps: {
          create: WORKFLOW_STEP_TYPES.map((stepType) => ({
            stepType,
            stepOrder: getStepOrder(stepType),
            status: 'pending',
          })),
        },
      },
      include: {
        workflowSteps: {
          orderBy: { stepOrder: 'asc' },
        },
        project: true,
      },
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
