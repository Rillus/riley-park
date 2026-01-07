/**
 * GitHub API Client
 * 
 * Provides methods to interact with GitHub repositories
 * for fetching feature files and content.
 */

import { Octokit } from '@octokit/rest';

/**
 * Custom error class for GitHub API errors
 */
export class GitHubApiError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'GitHubApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Repository file metadata
 */
export interface RepositoryFile {
  name: string;
  path: string;
}

/**
 * Repository file with content
 */
export interface RepositoryFileWithContent extends RepositoryFile {
  content: string;
}

/**
 * Parse a GitHub repository URL to extract owner and repo
 * 
 * Supports:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - git@github.com:owner/repo
 * 
 * @param url - Repository URL
 * @returns Owner and repo, or null if invalid
 */
export function parseRepositoryUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;

  // HTTPS URL pattern: https://github.com/owner/repo(.git)?
  const httpsMatch = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?\/?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH URL pattern: git@github.com:owner/repo(.git)?
  const sshMatch = url.match(/^git@github\.com:([^\/]+)\/([^\/\.]+)(\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

/**
 * GitHub API client for fetching repository content
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Get list of feature files from the docs/features directory
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param ref - Branch or commit reference
   * @returns Array of feature files (excluding README.md)
   */
  async getFeatureFiles(
    owner: string,
    repo: string,
    ref: string
  ): Promise<RepositoryFile[]> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'docs/features',
        ref,
      });

      // Response should be an array for directories
      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .filter((item) => {
          // Only include files (not directories)
          if (item.type !== 'file') return false;
          // Only include .md files
          if (!item.name.endsWith('.md')) return false;
          // Exclude README files
          if (item.name.toLowerCase() === 'readme.md') return false;
          return true;
        })
        .map((item) => ({
          name: item.name,
          path: item.path,
        }));
    } catch (error: unknown) {
      // If the directory doesn't exist, return empty array
      if (isGitHubError(error) && error.status === 404) {
        return [];
      }
      throw new GitHubApiError(
        isGitHubError(error) ? error.message : 'Failed to fetch feature files',
        isGitHubError(error) ? error.status : undefined
      );
    }
  }

  /**
   * Get content of a single file
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - File path
   * @param ref - Branch or commit reference
   * @returns File content as string
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref: string
  ): Promise<string> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // Single file response
      if (Array.isArray(response.data)) {
        throw new Error('Path is not a file');
      }

      if (response.data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      // Content is base64 encoded
      const content = response.data.content;
      if (!content) {
        return '';
      }

      return Buffer.from(content, 'base64').toString('utf-8');
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Path is not a file') {
        throw error;
      }
      throw new GitHubApiError(
        isGitHubError(error) ? error.message : 'Failed to fetch file content',
        isGitHubError(error) ? error.status : undefined
      );
    }
  }

  /**
   * Get all feature files with their content
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param ref - Branch or commit reference
   * @returns Array of feature files with content
   */
  async getFeatureFilesWithContent(
    owner: string,
    repo: string,
    ref: string
  ): Promise<RepositoryFileWithContent[]> {
    const files = await this.getFeatureFiles(owner, repo, ref);
    const filesWithContent: RepositoryFileWithContent[] = [];

    for (const file of files) {
      try {
        const content = await this.getFileContent(owner, repo, file.path, ref);
        filesWithContent.push({
          ...file,
          content,
        });
      } catch (error) {
        // Log error but continue with other files
        console.error(`Failed to fetch content for ${file.path}:`, error);
      }
    }

    return filesWithContent;
  }
}

/**
 * Type guard for GitHub API errors
 */
function isGitHubError(error: unknown): error is { status: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    'message' in error
  );
}

/**
 * Create a GitHub client with optional authentication
 */
export function createGitHubClient(): GitHubClient {
  const token = process.env.GITHUB_TOKEN;
  return new GitHubClient(token);
}
