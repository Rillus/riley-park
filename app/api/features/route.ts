/**
 * API Routes for Feature Management
 * 
 * POST /api/features - Create a new feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createFeatureSchema, WORKFLOW_STEPS_ORDER } from '@/lib/features/types';

/**
 * POST /api/features
 * Create a new feature with automatically initialised workflow steps
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

      // Create workflow steps
      await tx.workflowStep.createMany({
        data: WORKFLOW_STEPS_ORDER.map((stepType) => ({
          featureId: newFeature.id,
          stepType,
          status: 'pending',
        })),
      });

      // Fetch the complete feature with workflow steps
      return tx.feature.findUnique({
        where: { id: newFeature.id },
        include: {
          workflowSteps: {
            orderBy: { createdAt: 'asc' },
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
