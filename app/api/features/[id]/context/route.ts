/**
 * API Routes for Feature Context
 * 
 * GET /api/features/:id/context - Get all feature context entries
 * POST /api/features/:id/context - Create feature context entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createFeatureContextSchema } from '@/lib/context/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/features/:id/context
 * Get all feature context entries
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: featureId } = await params;

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

    // Get all feature context entries
    const contexts = await prisma.featureContext.findMany({
      where: { featureId },
      orderBy: [
        { contextType: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ contexts });
  } catch (error) {
    console.error('Error fetching feature context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature context' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features/:id/context
 * Create feature context entry
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: featureId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = createFeatureContextSchema.safeParse(body);
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

    // Create feature context
    const context = await prisma.featureContext.create({
      data: {
        featureId,
        content: validationResult.data.content,
        contextType: validationResult.data.contextType,
      },
    });

    return NextResponse.json({ context }, { status: 201 });
  } catch (error) {
    console.error('Error creating feature context:', error);
    return NextResponse.json(
      { error: 'Failed to create feature context' },
      { status: 500 }
    );
  }
}

