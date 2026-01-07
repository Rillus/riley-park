/**
 * Tests for Feature Sync Service
 */

import { 
  FeatureSyncService, 
  parsePriorityFromMarkdown,
  parseStatusFromMarkdown,
  extractFeatureIdFromFilename,
} from '../sync';
import { prisma } from '@/lib/db';
import { GitHubClient } from '@/lib/github';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    feature: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workflowStep: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      feature: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      workflowStep: {
        createMany: jest.fn(),
      },
    })),
  },
}));

jest.mock('@/lib/github', () => ({
  GitHubClient: jest.fn(),
  parseRepositoryUrl: jest.fn(),
  createGitHubClient: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('parsePriorityFromMarkdown', () => {
  it('should parse P0 priority as high', () => {
    expect(parsePriorityFromMarkdown('P0 (Must Have)')).toBe('high');
    expect(parsePriorityFromMarkdown('P0')).toBe('high');
  });

  it('should parse P1 priority as high', () => {
    expect(parsePriorityFromMarkdown('P1 (High)')).toBe('high');
    expect(parsePriorityFromMarkdown('P1')).toBe('high');
  });

  it('should parse P2 priority as medium', () => {
    expect(parsePriorityFromMarkdown('P2 (Medium)')).toBe('medium');
    expect(parsePriorityFromMarkdown('P2')).toBe('medium');
  });

  it('should parse P3 priority as low', () => {
    expect(parsePriorityFromMarkdown('P3 (Low)')).toBe('low');
    expect(parsePriorityFromMarkdown('P3')).toBe('low');
  });

  it('should parse high/medium/low strings', () => {
    expect(parsePriorityFromMarkdown('high')).toBe('high');
    expect(parsePriorityFromMarkdown('High')).toBe('high');
    expect(parsePriorityFromMarkdown('medium')).toBe('medium');
    expect(parsePriorityFromMarkdown('Medium')).toBe('medium');
    expect(parsePriorityFromMarkdown('low')).toBe('low');
    expect(parsePriorityFromMarkdown('Low')).toBe('low');
  });

  it('should return medium for unknown priorities', () => {
    expect(parsePriorityFromMarkdown('unknown')).toBe('medium');
    expect(parsePriorityFromMarkdown(undefined)).toBe('medium');
    expect(parsePriorityFromMarkdown('')).toBe('medium');
  });
});

describe('parseStatusFromMarkdown', () => {
  it('should parse Not Started as planned', () => {
    expect(parseStatusFromMarkdown('Not Started')).toBe('planned');
    expect(parseStatusFromMarkdown('not started')).toBe('planned');
  });

  it('should parse In Progress as in_progress', () => {
    expect(parseStatusFromMarkdown('In Progress')).toBe('in_progress');
    expect(parseStatusFromMarkdown('in progress')).toBe('in_progress');
  });

  it('should parse Completed as completed', () => {
    expect(parseStatusFromMarkdown('Completed')).toBe('completed');
    expect(parseStatusFromMarkdown('completed')).toBe('completed');
    expect(parseStatusFromMarkdown('✅ Completed')).toBe('completed');
  });

  it('should parse Blocked as blocked', () => {
    expect(parseStatusFromMarkdown('Blocked')).toBe('blocked');
    expect(parseStatusFromMarkdown('blocked')).toBe('blocked');
  });

  it('should parse planned as planned', () => {
    expect(parseStatusFromMarkdown('Planned')).toBe('planned');
    expect(parseStatusFromMarkdown('planned')).toBe('planned');
  });

  it('should return planned for unknown statuses', () => {
    expect(parseStatusFromMarkdown('unknown')).toBe('planned');
    expect(parseStatusFromMarkdown(undefined)).toBe('planned');
    expect(parseStatusFromMarkdown('')).toBe('planned');
  });
});

describe('extractFeatureIdFromFilename', () => {
  it('should extract feature ID from standard filename', () => {
    expect(extractFeatureIdFromFilename('001-basic-agent-messaging.md'))
      .toBe('001-basic-agent-messaging');
  });

  it('should extract feature ID from filename with letter suffix', () => {
    expect(extractFeatureIdFromFilename('001b-feature-list.md'))
      .toBe('001b-feature-list');
  });

  it('should extract feature ID from three-digit number', () => {
    expect(extractFeatureIdFromFilename('012-some-feature.md'))
      .toBe('012-some-feature');
  });

  it('should remove .md extension', () => {
    expect(extractFeatureIdFromFilename('test-feature.md'))
      .toBe('test-feature');
  });
});

describe('FeatureSyncService', () => {
  let syncService: FeatureSyncService;
  let mockGitHubClient: {
    getFeatureFilesWithContent: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGitHubClient = {
      getFeatureFilesWithContent: jest.fn(),
    };
    
    syncService = new FeatureSyncService(mockGitHubClient as unknown as GitHubClient);
  });

  describe('syncFeatures', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Test Project',
      repositoryUrl: 'https://github.com/owner/repo',
      defaultBranch: 'main',
      description: null,
      lastSyncedAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw error if project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(syncService.syncFeatures('nonexistent-project'))
        .rejects
        .toThrow('Project not found');
    });

    it('should throw error if repository URL cannot be parsed', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        repositoryUrl: 'invalid-url',
      });

      await expect(syncService.syncFeatures('project-1'))
        .rejects
        .toThrow('Could not parse repository URL');
    });

    it('should return sync results with created features', async () => {
      const { parseRepositoryUrl } = jest.requireMock('@/lib/github');
      parseRepositoryUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue(mockProject);
      
      mockGitHubClient.getFeatureFilesWithContent.mockResolvedValue([
        {
          name: '001-feature.md',
          path: 'docs/features/001-feature.md',
          content: '# Feature 001\n\n**Priority:** P1\n**Status:** Not Started\n\n## Overview\nDescription',
        },
      ]);

      // Mock transaction
      const mockTx = {
        feature: {
          findFirst: jest.fn().mockResolvedValue(null), // Feature doesn't exist
          create: jest.fn().mockResolvedValue({
            id: 'new-feature-1',
            projectId: 'project-1',
            externalId: '001-feature',
            title: 'Feature 001',
            description: '# Feature 001\n\n**Priority:** P1\n**Status:** Not Started\n\n## Overview\nDescription',
            priority: 'high',
            status: 'planned',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        workflowStep: {
          createMany: jest.fn().mockResolvedValue({ count: 6 }),
        },
      };
      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await syncService.syncFeatures('project-1');

      expect(result.synced).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockTx.feature.create).toHaveBeenCalled();
      expect(mockTx.workflowStep.createMany).toHaveBeenCalled();
    });

    it('should update existing features without creating workflow steps', async () => {
      const { parseRepositoryUrl } = jest.requireMock('@/lib/github');
      parseRepositoryUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue(mockProject);
      
      mockGitHubClient.getFeatureFilesWithContent.mockResolvedValue([
        {
          name: '001-feature.md',
          path: 'docs/features/001-feature.md',
          content: '# Feature 001 Updated\n\n**Priority:** P0\n**Status:** In Progress\n\nDescription',
        },
      ]);

      const existingFeature = {
        id: 'existing-feature-1',
        projectId: 'project-1',
        externalId: '001-feature',
        title: 'Feature 001',
        description: 'Old description',
        priority: 'high',
        status: 'planned',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock transaction
      const mockTx = {
        feature: {
          findFirst: jest.fn().mockResolvedValue(existingFeature),
          update: jest.fn().mockResolvedValue({
            ...existingFeature,
            title: 'Feature 001 Updated',
          }),
        },
        workflowStep: {
          createMany: jest.fn(),
        },
      };
      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTx));

      const result = await syncService.syncFeatures('project-1');

      expect(result.synced).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockTx.feature.update).toHaveBeenCalled();
      expect(mockTx.workflowStep.createMany).not.toHaveBeenCalled();
    });

    it('should continue processing when one feature fails', async () => {
      const { parseRepositoryUrl } = jest.requireMock('@/lib/github');
      parseRepositoryUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue(mockProject);
      
      mockGitHubClient.getFeatureFilesWithContent.mockResolvedValue([
        {
          name: '001-feature.md',
          path: 'docs/features/001-feature.md',
          content: '# Feature 001\n\nDescription',
        },
        {
          name: '002-feature.md',
          path: 'docs/features/002-feature.md',
          content: '# Feature 002\n\nDescription',
        },
      ]);

      // Mock transaction - first feature fails, second succeeds
      let callCount = 0;
      mockPrisma.$transaction.mockImplementation((callback) => {
        callCount++;
        if (callCount === 1) {
          // First feature throws an error
          const mockTx = {
            feature: {
              findFirst: jest.fn().mockRejectedValue(new Error('Database error')),
            },
            workflowStep: { createMany: jest.fn() },
          };
          return callback(mockTx);
        } else {
          // Second feature succeeds
          const mockTx = {
            feature: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({
                id: 'new-feature-2',
                projectId: 'project-1',
                externalId: '002-feature',
                title: 'Feature 002',
                description: '# Feature 002\n\nDescription',
                priority: 'medium',
                status: 'planned',
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            },
            workflowStep: {
              createMany: jest.fn().mockResolvedValue({ count: 6 }),
            },
          };
          return callback(mockTx);
        }
      });

      const result = await syncService.syncFeatures('project-1');

      expect(result.synced).toBe(1);
      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('001-feature.md');
    });

    it('should update project sync status on success', async () => {
      const { parseRepositoryUrl } = jest.requireMock('@/lib/github');
      parseRepositoryUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue(mockProject);
      
      mockGitHubClient.getFeatureFilesWithContent.mockResolvedValue([]);

      await syncService.syncFeatures('project-1');

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: expect.objectContaining({
          lastSyncStatus: 'success',
          lastSyncError: null,
        }),
      });
    });

    it('should update project sync status on error', async () => {
      const { parseRepositoryUrl } = jest.requireMock('@/lib/github');
      parseRepositoryUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue(mockProject);
      
      mockGitHubClient.getFeatureFilesWithContent.mockRejectedValue(
        new Error('GitHub API error')
      );

      await expect(syncService.syncFeatures('project-1'))
        .rejects
        .toThrow('GitHub API error');

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: expect.objectContaining({
          lastSyncStatus: 'error',
          lastSyncError: 'GitHub API error',
        }),
      });
    });
  });
});
