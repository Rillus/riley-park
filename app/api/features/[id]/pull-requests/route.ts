/**
 * API Routes for Feature Pull Requests
 * 
 * GET /api/features/:id/pull-requests - Get all PRs for a feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/features/:id/pull-requests
 * Get all PRs for a specific feature
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

    // Get all PRs for this feature
    const pullRequests = await prisma.pullRequest.findMany({
      where: { featureId },
      include: {
        workflowStep: {
          select: {
            id: true,
            stepType: true,
            stepOrder: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      pullRequests,
      total: pullRequests.length,
    });
  } catch (error) {
    console.error('Error fetching feature pull requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature pull requests' },
      { status: 500 }
    );
  }
}

