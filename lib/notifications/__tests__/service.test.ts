/**
 * Tests for Notification Service
 */

import {
  notifyAgentFinished,
  notifyAgentNeedsInput,
  notifyPRCreated,
  notifyPRReviewReady,
  notifyStepComplete,
  notifyError,
  createNotification,
} from '../service';
import { prisma } from '@/lib/db';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
    },
  },
}));

const mockPrismaCreate = prisma.notification.create as jest.MockedFunction<
  typeof prisma.notification.create
>;

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaCreate.mockResolvedValue({
      id: 'notif-123',
      userId: null,
      type: 'agent_finished',
      title: 'Test',
      message: 'Test message',
      read: false,
      actionUrl: null,
      metadata: null,
      createdAt: new Date(),
    });
  });

  describe('createNotification', () => {
    it('should create a notification with all fields', async () => {
      await createNotification({
        type: 'agent_finished',
        title: 'Agent Completed',
        message: 'Your agent has finished',
        actionUrl: '/agents/123',
        metadata: { agentId: '123' },
      });

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          type: 'agent_finished',
          title: 'Agent Completed',
          message: 'Your agent has finished',
          actionUrl: '/agents/123',
          metadata: JSON.stringify({ agentId: '123' }),
          userId: undefined,
        },
      });
    });

    it('should create a notification with minimal fields', async () => {
      await createNotification({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong',
      });

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          type: 'error',
          title: 'Error',
          message: 'Something went wrong',
          actionUrl: undefined,
          metadata: undefined,
          userId: undefined,
        },
      });
    });
  });

  describe('notifyAgentFinished', () => {
    it('should create an agent finished notification', async () => {
      await notifyAgentFinished('agent-123', 'feature-456');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'agent_finished',
          title: 'Agent Completed',
          actionUrl: '/agents/agent-123/conversation',
          metadata: JSON.stringify({ agentId: 'agent-123', featureId: 'feature-456' }),
        }),
      });
    });

    it('should create notification without featureId', async () => {
      await notifyAgentFinished('agent-123');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'agent_finished',
          title: 'Agent Completed',
          metadata: JSON.stringify({ agentId: 'agent-123' }),
        }),
      });
    });
  });

  describe('notifyAgentNeedsInput', () => {
    it('should create an agent needs input notification', async () => {
      await notifyAgentNeedsInput('agent-123', 'feature-456');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'agent_needs_input',
          title: 'Agent Needs Input',
          actionUrl: '/agents/agent-123/conversation',
          metadata: JSON.stringify({ agentId: 'agent-123', featureId: 'feature-456' }),
        }),
      });
    });
  });

  describe('notifyPRCreated', () => {
    it('should create a PR created notification', async () => {
      await notifyPRCreated('https://github.com/user/repo/pull/123', 'feature-456');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'pr_created',
          title: 'Pull Request Created',
          actionUrl: 'https://github.com/user/repo/pull/123',
          metadata: JSON.stringify({
            prUrl: 'https://github.com/user/repo/pull/123',
            featureId: 'feature-456',
          }),
        }),
      });
    });

    it('should create PR notification without featureId', async () => {
      await notifyPRCreated('https://github.com/user/repo/pull/123');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'pr_created',
          title: 'Pull Request Created',
          metadata: JSON.stringify({ prUrl: 'https://github.com/user/repo/pull/123' }),
        }),
      });
    });
  });

  describe('notifyPRReviewReady', () => {
    it('should create a PR review ready notification', async () => {
      await notifyPRReviewReady('https://github.com/user/repo/pull/123', 'feature-456');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'pr_review_ready',
          title: 'PR Review Ready',
          actionUrl: 'https://github.com/user/repo/pull/123',
          metadata: JSON.stringify({
            prUrl: 'https://github.com/user/repo/pull/123',
            featureId: 'feature-456',
          }),
        }),
      });
    });
  });

  describe('notifyStepComplete', () => {
    it('should create a step complete notification', async () => {
      await notifyStepComplete('feature-456', 'step-789', 'Implementation');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'step_complete',
          title: 'Workflow Step Complete',
          actionUrl: '/features',
          metadata: JSON.stringify({
            featureId: 'feature-456',
            stepId: 'step-789',
            stepName: 'Implementation',
          }),
        }),
      });
    });
  });

  describe('notifyError', () => {
    it('should create an error notification with Error object', async () => {
      const error = new Error('Something went wrong');
      await notifyError('agent-123', error);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'error',
          title: 'Agent Error',
          message: expect.stringContaining('Something went wrong'),
          actionUrl: '/agents/agent-123/conversation',
          metadata: JSON.stringify({
            agentId: 'agent-123',
            errorMessage: 'Something went wrong',
          }),
        }),
      });
    });

    it('should create an error notification with string error', async () => {
      await notifyError('agent-123', 'Custom error message');

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'error',
          title: 'Agent Error',
          message: expect.stringContaining('Custom error message'),
          metadata: JSON.stringify({
            agentId: 'agent-123',
            errorMessage: 'Custom error message',
          }),
        }),
      });
    });
  });
});
