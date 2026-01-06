/**
 * Tests for Agent Status Monitoring Service
 */

import {
  WorkflowMonitor,
  AgentStatusCache,
  getActiveWorkflowSteps,
  checkAgentStatusChange,
  processAgentCompletion,
} from '../monitoring';
import { WorkflowStepData, AgentStatusChangeEvent } from '../types';
import { AgentStatus, AgentStatusResponse } from '@/lib/cursor-api/types';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    workflowStep: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    feature: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

// Mock Cursor API Client
jest.mock('@/lib/cursor-api', () => ({
  CursorAPIClient: jest.fn().mockImplementation(() => ({
    getAgentStatus: jest.fn(),
    getConversation: jest.fn(),
  })),
}));

import { prisma } from '@/lib/db';
import { CursorAPIClient } from '@/lib/cursor-api';

// Helper to create mock workflow step
function createMockStep(overrides: Partial<WorkflowStepData> = {}): WorkflowStepData {
  return {
    id: 'step-1',
    featureId: 'feature-1',
    stepType: 'spec',
    stepOrder: 1,
    status: 'in_progress',
    agentId: 'agent-123',
    output: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Agent Status Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.notification.create as jest.Mock).mockResolvedValue({});
    (prisma.workflowStep.update as jest.Mock).mockResolvedValue({});
    (prisma.feature.update as jest.Mock).mockResolvedValue({});
  });

  describe('AgentStatusCache', () => {
    it('should cache agent status', () => {
      const cache = new AgentStatusCache();
      cache.set('agent-1', 'RUNNING');
      expect(cache.get('agent-1')).toBe('RUNNING');
    });

    it('should detect status changes', () => {
      const cache = new AgentStatusCache();
      cache.set('agent-1', 'RUNNING');
      
      expect(cache.hasChanged('agent-1', 'FINISHED')).toBe(true);
      expect(cache.hasChanged('agent-1', 'RUNNING')).toBe(false);
    });

    it('should return true for new agents', () => {
      const cache = new AgentStatusCache();
      expect(cache.hasChanged('new-agent', 'RUNNING')).toBe(true);
    });

    it('should clear cache', () => {
      const cache = new AgentStatusCache();
      cache.set('agent-1', 'RUNNING');
      cache.clear();
      expect(cache.get('agent-1')).toBeUndefined();
    });

    it('should delete specific agent', () => {
      const cache = new AgentStatusCache();
      cache.set('agent-1', 'RUNNING');
      cache.set('agent-2', 'FINISHED');
      cache.delete('agent-1');
      expect(cache.get('agent-1')).toBeUndefined();
      expect(cache.get('agent-2')).toBe('FINISHED');
    });
  });

  describe('getActiveWorkflowSteps', () => {
    it('should return in_progress steps with agent IDs', async () => {
      const mockFeature = {
        id: 'feature-1',
        projectId: 'project-1',
        title: 'Test Feature',
        description: 'Test',
        priority: 'medium',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSteps = [
        { ...createMockStep({ id: 'step-1', agentId: 'agent-1' }), feature: mockFeature },
        { ...createMockStep({ id: 'step-2', agentId: 'agent-2', stepType: 'design', stepOrder: 2 }), feature: mockFeature },
      ];

      (prisma.workflowStep.findMany as jest.Mock).mockResolvedValue(mockSteps);

      const result = await getActiveWorkflowSteps();

      expect(result).toHaveLength(2);
      expect(prisma.workflowStep.findMany).toHaveBeenCalledWith({
        where: {
          status: 'in_progress',
          agentId: { not: null },
        },
        include: {
          feature: true,
        },
      });
    });

    it('should return empty array when no active steps', async () => {
      (prisma.workflowStep.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getActiveWorkflowSteps();

      expect(result).toHaveLength(0);
    });
  });

  describe('checkAgentStatusChange', () => {
    it('should detect RUNNING to FINISHED transition', async () => {
      const mockClient = new CursorAPIClient('test-key');
      const mockStatus: AgentStatusResponse = {
        id: 'agent-123',
        status: 'FINISHED',
        repository: 'https://github.com/test/repo',
      };

      (mockClient.getAgentStatus as jest.Mock).mockResolvedValue(mockStatus);

      const step = createMockStep({ agentId: 'agent-123' });
      const cache = new AgentStatusCache();
      cache.set('agent-123', 'RUNNING');

      const result = await checkAgentStatusChange(mockClient, step, cache);

      expect(result).not.toBeNull();
      expect(result?.previousStatus).toBe('RUNNING');
      expect(result?.newStatus).toBe('FINISHED');
    });

    it('should return null when status unchanged', async () => {
      const mockClient = new CursorAPIClient('test-key');
      const mockStatus: AgentStatusResponse = {
        id: 'agent-123',
        status: 'RUNNING',
      };

      (mockClient.getAgentStatus as jest.Mock).mockResolvedValue(mockStatus);

      const step = createMockStep({ agentId: 'agent-123' });
      const cache = new AgentStatusCache();
      cache.set('agent-123', 'RUNNING');

      const result = await checkAgentStatusChange(mockClient, step, cache);

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const mockClient = new CursorAPIClient('test-key');
      (mockClient.getAgentStatus as jest.Mock).mockRejectedValue(new Error('API Error'));

      const step = createMockStep({ agentId: 'agent-123' });
      const cache = new AgentStatusCache();

      const result = await checkAgentStatusChange(mockClient, step, cache);

      expect(result).toBeNull();
    });

    it('should return null when agent ID is missing', async () => {
      const mockClient = new CursorAPIClient('test-key');
      const step = createMockStep({ agentId: null });
      const cache = new AgentStatusCache();

      const result = await checkAgentStatusChange(mockClient, step, cache);

      expect(result).toBeNull();
    });
  });

  describe('processAgentCompletion', () => {
    it('should process agent completion event', async () => {
      const mockClient = new CursorAPIClient('test-key');
      const mockConversation = {
        agentId: 'agent-123',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: '# Specification: Test\n\n## Overview\nTest content',
            timestamp: '2025-01-01T00:00:00Z',
          },
        ],
      };

      (mockClient.getConversation as jest.Mock).mockResolvedValue(mockConversation);

      const mockFeature = {
        id: 'feature-1',
        projectId: 'project-1',
        title: 'Test Feature',
        description: 'Test',
        priority: 'medium',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowSteps: [
          createMockStep({ status: 'in_progress' }),
          createMockStep({ id: 'step-2', stepType: 'design', stepOrder: 2, status: 'pending', agentId: null }),
        ],
      };

      (prisma.feature.findUnique as jest.Mock).mockResolvedValue(mockFeature);

      const event: AgentStatusChangeEvent = {
        agentId: 'agent-123',
        previousStatus: 'RUNNING',
        newStatus: 'FINISHED',
        workflowStep: createMockStep(),
        feature: mockFeature,
      };

      const result = await processAgentCompletion(mockClient, event);

      expect(result.success).toBe(true);
      expect(prisma.workflowStep.update).toHaveBeenCalled();
    });

    it('should handle ERROR status', async () => {
      const mockClient = new CursorAPIClient('test-key');

      const mockFeature = {
        id: 'feature-1',
        projectId: 'project-1',
        title: 'Test Feature',
        description: 'Test',
        priority: 'medium',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowSteps: [createMockStep()],
      };

      (prisma.feature.findUnique as jest.Mock).mockResolvedValue(mockFeature);

      const event: AgentStatusChangeEvent = {
        agentId: 'agent-123',
        previousStatus: 'RUNNING',
        newStatus: 'ERROR',
        workflowStep: createMockStep(),
        feature: mockFeature,
      };

      const result = await processAgentCompletion(mockClient, event);

      expect(result.success).toBe(true);
      expect(prisma.workflowStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'blocked',
          }),
        })
      );
    });

    it('should handle STOPPED status', async () => {
      const mockClient = new CursorAPIClient('test-key');

      const mockFeature = {
        id: 'feature-1',
        projectId: 'project-1',
        title: 'Test Feature',
        description: 'Test',
        priority: 'medium',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowSteps: [createMockStep()],
      };

      (prisma.feature.findUnique as jest.Mock).mockResolvedValue(mockFeature);

      const event: AgentStatusChangeEvent = {
        agentId: 'agent-123',
        previousStatus: 'RUNNING',
        newStatus: 'STOPPED',
        workflowStep: createMockStep(),
        feature: mockFeature,
      };

      const result = await processAgentCompletion(mockClient, event);

      expect(result.success).toBe(true);
      expect(prisma.workflowStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'pending',
          }),
        })
      );
    });
  });

  describe('WorkflowMonitor', () => {
    it('should start and stop polling', () => {
      const monitor = new WorkflowMonitor('test-api-key', 1000);

      expect(monitor.isRunning()).toBe(false);
      
      monitor.start();
      expect(monitor.isRunning()).toBe(true);

      monitor.stop();
      expect(monitor.isRunning()).toBe(false);
    });

    it('should not start if already running', () => {
      const monitor = new WorkflowMonitor('test-api-key', 1000);
      
      monitor.start();
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      monitor.start();
      
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('already running'));
      spy.mockRestore();
      monitor.stop();
    });

    it('should update polling interval', () => {
      const monitor = new WorkflowMonitor('test-api-key', 1000);
      
      monitor.setPollingInterval(5000);
      expect(monitor.getPollingInterval()).toBe(5000);
    });

    it('should enforce minimum polling interval', () => {
      const monitor = new WorkflowMonitor('test-api-key', 1000);
      
      monitor.setPollingInterval(100); // Below minimum
      expect(monitor.getPollingInterval()).toBeGreaterThanOrEqual(1000);
    });

    it('should enforce maximum polling interval', () => {
      const monitor = new WorkflowMonitor('test-api-key', 1000);
      
      monitor.setPollingInterval(60000); // Above maximum
      expect(monitor.getPollingInterval()).toBeLessThanOrEqual(30000);
    });

    it('should allow adding event handlers', () => {
      const monitor = new WorkflowMonitor('test-api-key', 1000);
      const handler = jest.fn();

      monitor.onStatusChange(handler);
      monitor.onStepCompleted(handler);
      monitor.onError(handler);

      // Just ensure no errors
      expect(true).toBe(true);
      monitor.stop();
    });
  });
});
