/**
 * API Routes for Individual Shortcut Management
 * 
 * GET /api/shortcuts/:id - Get shortcut details
 * PUT /api/shortcuts/:id - Update shortcut
 * DELETE /api/shortcuts/:id - Delete shortcut
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateShortcutSchema, extractVariables } from '@/lib/shortcuts/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/shortcuts/:id
 * Get a shortcut by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const shortcut = await prisma.shortcut.findUnique({
      where: { id },
    });

    if (!shortcut) {
      return NextResponse.json(
        { error: 'Shortcut not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ shortcut });
  } catch (error) {
    console.error('Error fetching shortcut:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shortcut' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/shortcuts/:id
 * Update a shortcut
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if shortcut exists
    const existing = await prisma.shortcut.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Shortcut not found' },
        { status: 404 }
      );
    }

    // Prevent editing predefined shortcuts
    if (existing.isPredefined) {
      return NextResponse.json(
        { error: 'Cannot edit predefined shortcuts' },
        { status: 403 }
      );
    }

    // Validate input
    const validationResult = updateShortcutSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (validationResult.data.name !== undefined) {
      updateData.name = validationResult.data.name;
    }
    if (validationResult.data.promptTemplate !== undefined) {
      updateData.promptTemplate = validationResult.data.promptTemplate;
      // Re-extract variables if template changed
      const variables = extractVariables(validationResult.data.promptTemplate);
      updateData.variables = JSON.stringify(variables);
    }
    if (validationResult.data.category !== undefined) {
      updateData.category = validationResult.data.category;
    }

    const shortcut = await prisma.shortcut.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ shortcut });
  } catch (error) {
    console.error('Error updating shortcut:', error);
    return NextResponse.json(
      { error: 'Failed to update shortcut' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shortcuts/:id
 * Delete a shortcut
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if shortcut exists
    const existing = await prisma.shortcut.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Shortcut not found' },
        { status: 404 }
      );
    }

    // Prevent deleting predefined shortcuts
    if (existing.isPredefined) {
      return NextResponse.json(
        { error: 'Cannot delete predefined shortcuts' },
        { status: 403 }
      );
    }

    await prisma.shortcut.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shortcut:', error);
    return NextResponse.json(
      { error: 'Failed to delete shortcut' },
      { status: 500 }
    );
  }
}

