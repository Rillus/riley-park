/**
 * API Routes for Feature Workflow Steps
 * 
 * GET /api/features/:id/workflow - Get workflow steps for a feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/features/:id/workflow
 * Get all workflow steps for a feature
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

    // Fetch workflow steps
    const workflowSteps = await prisma.workflowStep.findMany({
      where: { featureId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ workflowSteps });
  } catch (error) {
    console.error('Error fetching workflow steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow steps' },
      { status: 500 }
    );
  }
}
