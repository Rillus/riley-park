/**
 * API Routes for Individual Pull Request Management
 * 
 * GET /api/pull-requests/:id - Get PR details
 * PUT /api/pull-requests/:id - Update PR
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updatePullRequestSchema } from '@/lib/pull-requests/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pull-requests/:id
 * Get a single PR by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const pullRequest = await prisma.pullRequest.findUnique({
      where: { id },
      include: {
        feature: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
                repositoryUrl: true,
              },
            },
          },
        },
        workflowStep: {
          select: {
            id: true,
            stepType: true,
            stepOrder: true,
            status: true,
          },
        },
      },
    });

    if (!pullRequest) {
      return NextResponse.json(
        { error: 'Pull request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pullRequest });
  } catch (error) {
    console.error('Error fetching pull request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pull request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pull-requests/:id
 * Update a PR (status, title, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if PR exists
    const existingPR = await prisma.pullRequest.findUnique({
      where: { id },
    });

    if (!existingPR) {
      return NextResponse.json(
        { error: 'Pull request not found' },
        { status: 404 }
      );
    }

    // Validate input
    const validationResult = updatePullRequestSchema.safeParse(body);
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

    const data = validationResult.data;

    // Update PR
    const pullRequest = await prisma.pullRequest.update({
      where: { id },
      data: {
        ...(data.prTitle !== undefined && { prTitle: data.prTitle }),
        ...(data.branchName !== undefined && { branchName: data.branchName }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.githubPrId !== undefined && { githubPrId: data.githubPrId }),
      },
      include: {
        feature: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        workflowStep: {
          select: {
            id: true,
            stepType: true,
            stepOrder: true,
          },
        },
      },
    });

    return NextResponse.json({ pullRequest });
  } catch (error) {
    console.error('Error updating pull request:', error);
    return NextResponse.json(
      { error: 'Failed to update pull request' },
      { status: 500 }
    );
  }
}

