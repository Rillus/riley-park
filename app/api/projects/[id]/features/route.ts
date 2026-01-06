/**
 * API Route for Project Features
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
 * Get all features for a project
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    
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

    const features = await prisma.feature.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        workflowSteps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ features, total: features.length });
  } catch (error) {
    console.error('Error fetching project features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}
