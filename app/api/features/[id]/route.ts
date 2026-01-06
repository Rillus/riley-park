/**
 * Feature Detail API
 * GET /api/features/:id - Get feature details with workflow steps
 * PUT /api/features/:id - Update feature
 * DELETE /api/features/:id - Delete feature
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidFeaturePriority, isValidFeatureStatus } from '@/lib/workflow/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        workflowSteps: {
          orderBy: { stepOrder: 'asc' },
        },
        project: true,
      },
    });

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ feature });
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, priority, status } = body;

    // Verify feature exists
    const existing = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        return NextResponse.json(
          { error: 'Description cannot be empty' },
          { status: 400 }
        );
      }
      updateData.description = description.trim();
    }
    if (priority !== undefined && isValidFeaturePriority(priority)) {
      updateData.priority = priority;
    }
    if (status !== undefined && isValidFeatureStatus(status)) {
      updateData.status = status;
    }

    const feature = await prisma.feature.update({
      where: { id },
      data: updateData,
      include: {
        workflowSteps: {
          orderBy: { stepOrder: 'asc' },
        },
        project: true,
      },
    });

    return NextResponse.json({ feature });
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { error: 'Failed to update feature' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify feature exists
    const existing = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Delete feature (cascade delete will remove workflow steps)
    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature' },
      { status: 500 }
    );
  }
}
