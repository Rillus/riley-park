/**
 * API Routes for Shortcut Management
 * 
 * GET /api/shortcuts - List all shortcuts (with optional filters)
 * POST /api/shortcuts - Create a new shortcut
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createShortcutSchema, extractVariables } from '@/lib/shortcuts/types';
import { seedPredefinedShortcuts } from '@/lib/shortcuts/seed';

/**
 * GET /api/shortcuts
 * List all shortcuts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPredefined = searchParams.get('isPredefined');
    const search = searchParams.get('search');

    // Ensure predefined shortcuts are seeded
    await seedPredefinedShortcuts();

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isPredefined !== null) {
      where.isPredefined = isPredefined === 'true';
    }

    const shortcuts = await prisma.shortcut.findMany({
      where,
      orderBy: [
        { isPredefined: 'desc' }, // Predefined shortcuts first
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Filter by search term if provided (client-side filtering for simplicity)
    let filteredShortcuts = shortcuts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredShortcuts = shortcuts.filter(
        (shortcut) =>
          shortcut.name.toLowerCase().includes(searchLower) ||
          shortcut.promptTemplate.toLowerCase().includes(searchLower) ||
          (shortcut.category && shortcut.category.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      shortcuts: filteredShortcuts,
      total: filteredShortcuts.length,
    });
  } catch (error) {
    console.error('Error fetching shortcuts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shortcuts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shortcuts
 * Create a new shortcut
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createShortcutSchema.safeParse(body);
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

    const { name, promptTemplate, category } = validationResult.data;

    // Extract variables from template
    const variables = extractVariables(promptTemplate);

    // Create the shortcut
    const shortcut = await prisma.shortcut.create({
      data: {
        name,
        promptTemplate,
        category: category || null,
        isPredefined: false,
        userId: null, // MVP - single user
        variables: JSON.stringify(variables),
      },
    });

    return NextResponse.json({ shortcut }, { status: 201 });
  } catch (error) {
    console.error('Error creating shortcut:', error);
    return NextResponse.json(
      { error: 'Failed to create shortcut' },
      { status: 500 }
    );
  }
}

