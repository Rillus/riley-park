/**
 * API Routes for Individual Feature Management
 * 
 * GET /api/features/:id - Get feature details
 * PUT /api/features/:id - Update feature
 * DELETE /api/features/:id - Delete feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFeatureFile } from '@/lib/features/parser';
import { prisma } from '@/lib/db';
import { updateFeatureSchema } from '@/lib/features/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/features/:id
 * Get a feature by ID - tries DB first, then falls back to spec files
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const includeProject = url.searchParams.get('include') === 'project';

    // Try to load the feature from the database first
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        workflowSteps: {
          // If 'stepOrder' exists, prefer it for ordering, otherwise fallback to 'createdAt'
          orderBy: { stepOrder: 'asc' },
        },
        ...(includeProject
          ? {
              project: {
                select: {
                  id: true,
                  name: true,
                  repositoryUrl: true,
                  defaultBranch: true,
                },
              },
            }
          : {}),
      },
    });

    if (feature) {
      return NextResponse.json({ feature });
    }

    // Fallback to reading from the spec file
    const specFeature = readFeatureFile(id);

    if (!specFeature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ feature: specFeature });
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/features/:id
 * Update a feature
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if feature exists
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existingFeature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Validate input using zod schema
    const validationResult = updateFeatureSchema.safeParse(body);
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

    const { title, description, priority, status } = validationResult.data;

    // Update the feature
    const feature = await prisma.feature.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
      },
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

    return NextResponse.json({ feature });
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { error: 'Failed to update feature' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/features/:id
 * Delete a feature and its workflow steps (cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if feature exists
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existingFeature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Delete the feature (workflow steps will cascade delete)
    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Feature deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature' },
      { status: 500 }
    );
  }
}
