/**
 * API Routes for Project Features
 * 
 * GET /api/projects/:id/features - List features for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id/features
 * List all features for a project with optional filtering and sorting
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    // Get filter and sort parameters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    // Build where clause
    const where: Record<string, unknown> = { projectId };
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    // Build orderBy clause
    const validSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderByDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Fetch features
    const features = await prisma.feature.findMany({
      where,
      orderBy: { [orderByField]: orderByDirection },
      include: {
        workflowSteps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({
      features,
      total: features.length,
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}
