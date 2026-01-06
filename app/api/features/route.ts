/**
 * API Routes for Features
 * 
 * GET /api/features - List feature spec files (from docs/features)
 * POST /api/features - Create a new database feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFeatureFiles } from '@/lib/features/parser';
import { prisma } from '@/lib/db';
import { createFeatureSchema, WORKFLOW_STEP_TYPES } from '@/lib/features/types';

/**
 * GET /api/features
 * Get all feature spec files from docs/features
 */
export async function GET() {
  try {
    const features = readFeatureFiles();
    return NextResponse.json({ features });
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

    // Create feature with workflow steps in a transaction
    const feature = await prisma.feature.create({
      data: {
        projectId,
        title,
        description,
        priority,
        workflowSteps: {
          create: WORKFLOW_STEP_TYPES.map((stepType) => ({
            stepType,
            status: 'pending',
          })),
        },
      },
      include: {
        workflowSteps: {
          orderBy: { createdAt: 'asc' },
        },
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

