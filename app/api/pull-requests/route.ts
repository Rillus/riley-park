/**
 * API Routes for Pull Request Management
 * 
 * GET /api/pull-requests - List all PRs (with optional filters)
 * POST /api/pull-requests - Create a new PR record
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createPullRequestSchema } from '@/lib/pull-requests/types';

/**
 * GET /api/pull-requests
 * List all PRs with optional filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    
    if (featureId) {
      where.featureId = featureId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (projectId) {
      where.feature = {
        projectId,
      };
    }

    const pullRequests = await prisma.pullRequest.findMany({
      where,
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
              },
            },
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
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({
      pullRequests,
      total: pullRequests.length,
    });
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pull requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pull-requests
 * Create a new PR record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createPullRequestSchema.safeParse(body);
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

    // Check if PR already exists
    const existingPR = await prisma.pullRequest.findFirst({
      where: {
        featureId: data.featureId,
        prUrl: data.prUrl,
      },
    });

    if (existingPR) {
      return NextResponse.json(
        { error: 'PR already exists for this feature' },
        { status: 409 }
      );
    }

    // Create PR record
    const pullRequest = await prisma.pullRequest.create({
      data: {
        featureId: data.featureId,
        workflowStepId: data.workflowStepId || null,
        agentId: data.agentId || null,
        prUrl: data.prUrl,
        prNumber: data.prNumber || null,
        prTitle: data.prTitle,
        branchName: data.branchName || null,
        status: data.status || 'open',
        githubPrId: data.githubPrId || null,
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

    return NextResponse.json(
      { pullRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating pull request:', error);
    return NextResponse.json(
      { error: 'Failed to create pull request' },
      { status: 500 }
    );
  }
}

