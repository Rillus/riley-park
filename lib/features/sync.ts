/**
 * Feature Sync Service
 * 
 * Syncs features from a project's repository docs/features folder
 * into the Riley Park database.
 */

import { prisma } from '@/lib/db';
import { 
  GitHubClient, 
  createGitHubClient, 
  parseRepositoryUrl,
  RepositoryFileWithContent 
} from '@/lib/github';
import { parseFeatureMetadata } from './parser';
import { WORKFLOW_STEPS_ORDER } from './types';

/**
 * Result of a feature sync operation
 */
export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

/**
 * Sync error details
 */
export interface SyncError {
  file: string;
  error: string;
}

/**
 * Parse priority string from markdown to database format
 */
export function parsePriorityFromMarkdown(priority: string | undefined): 'high' | 'medium' | 'low' {
  if (!priority) return 'medium';
  
  const lower = priority.toLowerCase();
  
  // P0, P1 = high priority
  if (lower.includes('p0') || lower.includes('p1')) return 'high';
  
  // P2 = medium priority
  if (lower.includes('p2')) return 'medium';
  
  // P3 = low priority
  if (lower.includes('p3')) return 'low';
  
  // Direct mapping
  if (lower.includes('high')) return 'high';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('low')) return 'low';
  
  return 'medium';
}

/**
 * Parse status string from markdown to database format
 */
export function parseStatusFromMarkdown(status: string | undefined): 'planned' | 'in_progress' | 'completed' | 'blocked' {
  if (!status) return 'planned';
  
  const lower = status.toLowerCase();
  
  // Map common status strings
  if (lower.includes('not started') || lower.includes('planned')) return 'planned';
  if (lower.includes('in progress') || lower.includes('in_progress')) return 'in_progress';
  if (lower.includes('completed') || lower.includes('done') || lower.includes('✅')) return 'completed';
  if (lower.includes('blocked')) return 'blocked';
  
  return 'planned';
}

/**
 * Extract feature ID from filename
 * e.g., "001-basic-agent-messaging.md" -> "001-basic-agent-messaging"
 */
export function extractFeatureIdFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, '');
}

/**
 * Feature Sync Service class
 */
export class FeatureSyncService {
  private githubClient: GitHubClient;

  constructor(githubClient?: GitHubClient) {
    this.githubClient = githubClient || createGitHubClient();
  }

  /**
   * Sync features from a project's repository
   * 
   * @param projectId - The project ID to sync features for
   * @returns Sync result with counts and errors
   */
  async syncFeatures(projectId: string): Promise<SyncResult> {
    const result: SyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Parse repository URL
    const repoInfo = parseRepositoryUrl(project.repositoryUrl);
    if (!repoInfo) {
      throw new Error('Could not parse repository URL. Only GitHub repositories are supported.');
    }

    try {
      // Update sync status to in_progress
      await prisma.project.update({
        where: { id: projectId },
        data: {
          lastSyncStatus: 'in_progress',
          lastSyncError: null,
        },
      });

      // Fetch feature files from repository
      const files = await this.githubClient.getFeatureFilesWithContent(
        repoInfo.owner,
        repoInfo.repo,
        project.defaultBranch
      );

      // Process each feature file
      for (const file of files) {
        try {
          const syncedFeature = await this.syncFeatureFile(projectId, file);
          result.synced++;
          if (syncedFeature.created) {
            result.created++;
          } else {
            result.updated++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`${file.name}: ${errorMessage}`);
          console.error(`Failed to sync feature ${file.name}:`, error);
        }
      }

      // Update sync status to success
      await prisma.project.update({
        where: { id: projectId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: 'success',
          lastSyncError: null,
        },
      });

      return result;
    } catch (error) {
      // Update sync status to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await prisma.project.update({
        where: { id: projectId },
        data: {
          lastSyncStatus: 'error',
          lastSyncError: errorMessage,
        },
      });
      throw error;
    }
  }

  /**
   * Sync a single feature file
   */
  private async syncFeatureFile(
    projectId: string,
    file: RepositoryFileWithContent
  ): Promise<{ created: boolean }> {
    // Parse feature metadata
    const metadata = parseFeatureMetadata(file.name, file.content);
    const externalId = extractFeatureIdFromFilename(file.name);
    const priority = parsePriorityFromMarkdown(metadata.priority);
    const status = parseStatusFromMarkdown(metadata.status);

    // Use transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
      // Check if feature exists
      const existingFeature = await tx.feature.findFirst({
        where: {
          projectId,
          externalId,
        },
      });

      if (existingFeature) {
        // Update existing feature (preserve workflow step progress)
        await tx.feature.update({
          where: { id: existingFeature.id },
          data: {
            title: metadata.title,
            description: file.content,
            priority,
            // Note: We preserve the existing status to not override workflow progress
            // unless the status in the markdown indicates completion
            ...(status === 'completed' ? { status: 'completed' } : {}),
          },
        });
        return { created: false };
      } else {
        // Create new feature
        const newFeature = await tx.feature.create({
          data: {
            projectId,
            externalId,
            title: metadata.title,
            description: file.content,
            priority,
            status,
          },
        });

        // Create workflow steps for new feature
        await tx.workflowStep.createMany({
          data: WORKFLOW_STEPS_ORDER.map((stepType, index) => ({
            featureId: newFeature.id,
            stepType,
            stepOrder: index + 1,
            status: 'pending',
          })),
        });

        return { created: true };
      }
    });
  }
}

/**
 * Create a feature sync service instance
 */
export function createFeatureSyncService(): FeatureSyncService {
  return new FeatureSyncService();
}
