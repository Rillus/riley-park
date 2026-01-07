/**
 * Tests for GitHub API client
 */

// Mock Octokit before importing
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      getContent: jest.fn(),
    },
  })),
}));

import { Octokit } from '@octokit/rest';
import { 
  parseRepositoryUrl, 
  GitHubClient, 
  GitHubApiError,
} from '../client';

const MockOctokit = Octokit as jest.MockedClass<typeof Octokit>;

describe('parseRepositoryUrl', () => {
  it('should parse HTTPS GitHub URLs', () => {
    const result = parseRepositoryUrl('https://github.com/owner/repo');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should parse HTTPS GitHub URLs with .git suffix', () => {
    const result = parseRepositoryUrl('https://github.com/owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should parse SSH GitHub URLs', () => {
    const result = parseRepositoryUrl('git@github.com:owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should parse SSH GitHub URLs without .git suffix', () => {
    const result = parseRepositoryUrl('git@github.com:owner/repo');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should handle URLs with trailing slash', () => {
    const result = parseRepositoryUrl('https://github.com/owner/repo/');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should return null for invalid URLs', () => {
    expect(parseRepositoryUrl('not-a-url')).toBeNull();
    expect(parseRepositoryUrl('https://gitlab.com/owner/repo')).toBeNull();
    expect(parseRepositoryUrl('https://github.com/')).toBeNull();
    expect(parseRepositoryUrl('')).toBeNull();
  });
});

describe('GitHubClient', () => {
  let client: GitHubClient;
  let mockGetContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetContent = jest.fn();
    MockOctokit.mockImplementation(() => ({
      repos: {
        getContent: mockGetContent,
      },
    }) as unknown as InstanceType<typeof Octokit>);
    client = new GitHubClient('test-token');
  });

  describe('getFeatureFiles', () => {
    it('should return empty array when docs/features directory does not exist', async () => {
      mockGetContent.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      const files = await client.getFeatureFiles('owner', 'repo', 'main');
      expect(files).toEqual([]);
    });

    it('should return feature files from docs/features directory', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '001-basic-feature.md', type: 'file', path: 'docs/features/001-basic-feature.md' },
          { name: '002-another-feature.md', type: 'file', path: 'docs/features/002-another-feature.md' },
          { name: 'README.md', type: 'file', path: 'docs/features/README.md' },
          { name: 'subfolder', type: 'dir', path: 'docs/features/subfolder' },
        ],
      });

      const files = await client.getFeatureFiles('owner', 'repo', 'main');
      
      expect(files).toHaveLength(2);
      expect(files[0]).toEqual({
        name: '001-basic-feature.md',
        path: 'docs/features/001-basic-feature.md',
      });
      expect(files[1]).toEqual({
        name: '002-another-feature.md',
        path: 'docs/features/002-another-feature.md',
      });
    });

    it('should exclude README.md from feature files', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '001-feature.md', type: 'file', path: 'docs/features/001-feature.md' },
          { name: 'README.md', type: 'file', path: 'docs/features/README.md' },
          { name: 'readme.md', type: 'file', path: 'docs/features/readme.md' },
        ],
      });

      const files = await client.getFeatureFiles('owner', 'repo', 'main');
      
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('001-feature.md');
    });

    it('should only include .md files', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '001-feature.md', type: 'file', path: 'docs/features/001-feature.md' },
          { name: 'config.json', type: 'file', path: 'docs/features/config.json' },
          { name: 'script.ts', type: 'file', path: 'docs/features/script.ts' },
        ],
      });

      const files = await client.getFeatureFiles('owner', 'repo', 'main');
      
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('001-feature.md');
    });

    it('should throw GitHubApiError for non-404 errors', async () => {
      mockGetContent.mockRejectedValue({
        status: 403,
        message: 'Rate limit exceeded',
      });

      await expect(client.getFeatureFiles('owner', 'repo', 'main'))
        .rejects
        .toThrow(GitHubApiError);
    });
  });

  describe('getFileContent', () => {
    it('should return file content', async () => {
      const content = '# Feature 001\n\nDescription here';
      const base64Content = Buffer.from(content).toString('base64');
      
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: base64Content,
          encoding: 'base64',
        },
      });

      const result = await client.getFileContent('owner', 'repo', 'docs/features/001-feature.md', 'main');
      expect(result).toBe(content);
    });

    it('should throw error when path is not a file', async () => {
      mockGetContent.mockResolvedValue({
        data: {
          type: 'dir',
        },
      });

      await expect(client.getFileContent('owner', 'repo', 'docs/features', 'main'))
        .rejects
        .toThrow('Path is not a file');
    });

    it('should throw GitHubApiError for API errors', async () => {
      mockGetContent.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      await expect(client.getFileContent('owner', 'repo', 'nonexistent.md', 'main'))
        .rejects
        .toThrow(GitHubApiError);
    });
  });

  describe('getFeatureFilesWithContent', () => {
    it('should return files with their content', async () => {
      const content1 = '# Feature 001\n\n**Priority:** P0\n**Status:** Not Started';
      const content2 = '# Feature 002\n\n**Priority:** P1\n**Status:** In Progress';
      
      // First call: get directory listing
      mockGetContent.mockResolvedValueOnce({
        data: [
          { name: '001-feature.md', type: 'file', path: 'docs/features/001-feature.md' },
          { name: '002-feature.md', type: 'file', path: 'docs/features/002-feature.md' },
        ],
      });
      
      // Second call: get file 1 content
      mockGetContent.mockResolvedValueOnce({
        data: {
          type: 'file',
          content: Buffer.from(content1).toString('base64'),
          encoding: 'base64',
        },
      });
      
      // Third call: get file 2 content
      mockGetContent.mockResolvedValueOnce({
        data: {
          type: 'file',
          content: Buffer.from(content2).toString('base64'),
          encoding: 'base64',
        },
      });

      const files = await client.getFeatureFilesWithContent('owner', 'repo', 'main');
      
      expect(files).toHaveLength(2);
      expect(files[0]).toEqual({
        name: '001-feature.md',
        path: 'docs/features/001-feature.md',
        content: content1,
      });
      expect(files[1]).toEqual({
        name: '002-feature.md',
        path: 'docs/features/002-feature.md',
        content: content2,
      });
    });

    it('should skip files that fail to load', async () => {
      const content1 = '# Feature 001';
      
      // First call: get directory listing
      mockGetContent.mockResolvedValueOnce({
        data: [
          { name: '001-feature.md', type: 'file', path: 'docs/features/001-feature.md' },
          { name: '002-feature.md', type: 'file', path: 'docs/features/002-feature.md' },
        ],
      });
      
      // Second call: get file 1 content - success
      mockGetContent.mockResolvedValueOnce({
        data: {
          type: 'file',
          content: Buffer.from(content1).toString('base64'),
          encoding: 'base64',
        },
      });
      
      // Third call: get file 2 content - failure
      mockGetContent.mockRejectedValueOnce({
        status: 404,
        message: 'Not Found',
      });

      const files = await client.getFeatureFilesWithContent('owner', 'repo', 'main');
      
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('001-feature.md');
    });
  });
});

describe('GitHubApiError', () => {
  it('should include status code and message', () => {
    const error = new GitHubApiError('Test error', 404);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('GitHubApiError');
  });
});
