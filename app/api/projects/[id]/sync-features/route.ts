/**
 * API Route for Feature Sync
 * 
 * POST /api/projects/:id/sync-features - Trigger feature sync from repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { FeatureSyncService } from '@/lib/features/sync';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/projects/:id/sync-features
 * Trigger a manual sync of features from the project repository
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if repository URL is a GitHub URL
    if (!project.repositoryUrl.includes('github.com')) {
      return NextResponse.json(
        { error: 'Only GitHub repositories are currently supported for feature sync' },
        { status: 400 }
      );
    }

    // Check GitHub token availability for private repos
    const hasGitHubToken = !!process.env.GITHUB_TOKEN;
    if (!hasGitHubToken) {
      console.warn('GITHUB_TOKEN not set - only public repositories will work');
    }

    // Create sync service and run sync
    const syncService = new FeatureSyncService();
    const result = await syncService.syncFeatures(id);

    return NextResponse.json({
      success: true,
      ...result,
      message: `Successfully synced ${result.synced} features (${result.created} created, ${result.updated} updated)`,
    });
  } catch (error) {
    console.error('Error syncing features:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Could not parse repository URL')) {
        return NextResponse.json(
          { 
            error: 'Invalid repository URL', 
            details: error.message,
            synced: 0,
            created: 0,
            updated: 0,
            errors: [error.message],
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'GitHub API rate limit exceeded. Please try again later.',
            details: error.message,
            synced: 0,
            created: 0,
            updated: 0,
            errors: [error.message],
          },
          { status: 429 }
        );
      }

      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return NextResponse.json(
          { 
            error: 'Repository or docs/features folder not found. Please check the repository URL and branch.',
            details: error.message,
            synced: 0,
            created: 0,
            updated: 0,
            errors: [error.message],
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Bad credentials') || error.message.includes('401')) {
        return NextResponse.json(
          { 
            error: 'GitHub authentication failed. Please check the GITHUB_TOKEN configuration.',
            details: error.message,
            synced: 0,
            created: 0,
            updated: 0,
            errors: [error.message],
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to sync features',
        details: error instanceof Error ? error.message : 'Unknown error',
        synced: 0,
        created: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      { status: 500 }
    );
  }
}
