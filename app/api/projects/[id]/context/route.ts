/**
 * API Routes for Project Context
 * 
 * GET /api/projects/:id/context - Get project context
 * PUT /api/projects/:id/context - Create or update project context
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createProjectContextSchema } from '@/lib/context/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id/context
 * Get project context
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

    // Get project context
    const context = await prisma.projectContext.findUnique({
      where: { projectId },
    });

    return NextResponse.json({ context });
  } catch (error) {
    console.error('Error fetching project context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project context' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/:id/context
 * Create or update project context
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = createProjectContextSchema.safeParse(body);
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

    // Upsert project context
    const context = await prisma.projectContext.upsert({
      where: { projectId },
      update: {
        content: validationResult.data.content,
      },
      create: {
        projectId,
        content: validationResult.data.content,
      },
    });

    return NextResponse.json({ context });
  } catch (error) {
    console.error('Error saving project context:', error);
    return NextResponse.json(
      { error: 'Failed to save project context' },
      { status: 500 }
    );
  }
}

