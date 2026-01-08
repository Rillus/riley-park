/**
 * API Routes for Feature Context Entry
 * 
 * PUT /api/features/:id/context/:contextId - Update feature context entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateFeatureContextSchema } from '@/lib/context/types';

interface RouteParams {
  params: Promise<{ id: string; contextId: string }>;
}

/**
 * PUT /api/features/:id/context/:contextId
 * Update feature context entry
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: featureId, contextId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateFeatureContextSchema.safeParse(body);
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

    // Check if feature exists
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Check if context exists and belongs to feature
    const existingContext = await prisma.featureContext.findUnique({
      where: { id: contextId },
    });

    if (!existingContext) {
      return NextResponse.json(
        { error: 'Context not found' },
        { status: 404 }
      );
    }

    if (existingContext.featureId !== featureId) {
      return NextResponse.json(
        { error: 'Context does not belong to this feature' },
        { status: 403 }
      );
    }

    // Update feature context
    const context = await prisma.featureContext.update({
      where: { id: contextId },
      data: {
        content: validationResult.data.content,
      },
    });

    return NextResponse.json({ context });
  } catch (error) {
    console.error('Error updating feature context:', error);
    return NextResponse.json(
      { error: 'Failed to update feature context' },
      { status: 500 }
    );
  }
}

