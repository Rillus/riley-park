/**
 * API Route for Feature Sync Status
 * 
 * GET /api/projects/:id/features/sync-status - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Sync status response type
 */
interface SyncStatusResponse {
  lastSyncedAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  hasGitHubToken: boolean;
}

/**
 * GET /api/projects/:id/features/sync-status
 * Get the last sync timestamp and status for a project
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        lastSyncedAt: true,
        lastSyncStatus: true,
        lastSyncError: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const response: SyncStatusResponse = {
      lastSyncedAt: project.lastSyncedAt?.toISOString() ?? null,
      lastSyncStatus: project.lastSyncStatus ?? null,
      lastSyncError: project.lastSyncError ?? null,
      hasGitHubToken: !!process.env.GITHUB_TOKEN,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
