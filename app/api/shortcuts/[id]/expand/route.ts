/**
 * API Route for Expanding Shortcuts with Variables
 * 
 * POST /api/shortcuts/:id/expand - Expand shortcut template with variable values
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { expandShortcutSchema } from '@/lib/shortcuts/types';
import { expandShortcut } from '@/lib/shortcuts/expansion';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/shortcuts/:id/expand
 * Expand a shortcut template with variable values
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get the shortcut
    const shortcut = await prisma.shortcut.findUnique({
      where: { id },
    });

    if (!shortcut) {
      return NextResponse.json(
        { error: 'Shortcut not found' },
        { status: 404 }
      );
    }

    // Validate input
    const validationResult = expandShortcutSchema.safeParse(body);
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

    // Expand the shortcut
    const expandedPrompt = expandShortcut(
      shortcut.promptTemplate,
      validationResult.data
    );

    return NextResponse.json({ expandedPrompt });
  } catch (error) {
    console.error('Error expanding shortcut:', error);
    return NextResponse.json(
      { error: 'Failed to expand shortcut' },
      { status: 500 }
    );
  }
}

