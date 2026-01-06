/**
 * API Routes for Project Management
 * 
 * GET /api/projects - List all projects
 * POST /api/projects - Create a new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createProjectSchema } from '@/lib/projects/types';

/**
 * GET /api/projects
 * List all projects with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { repositoryUrl: { contains: search } },
          ],
        }
      : undefined;

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      projects,
      total: projects.length,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createProjectSchema.safeParse(body);
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

    const { name, repositoryUrl, defaultBranch, description } = validationResult.data;

    // Check if repository URL is unique
    const existingProject = await prisma.project.findUnique({
      where: { repositoryUrl },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this repository URL already exists' },
        { status: 409 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        repositoryUrl,
        defaultBranch: defaultBranch || 'main',
        description,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
