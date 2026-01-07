/**
 * Tests for Step Completion Handler
 */

import {
  handleStepCompletion,
  createStepCompletedNotification,
  createWorkflowCompletedNotification,
  updateStepStatus,
  storeStepOutput,
} from '../completion-handler';
import { WorkflowStepData, FeatureData, WorkflowStepStatus, NotificationType } from '../types';
import { ConversationMessage } from '@/lib/cursor-api/types';

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    workflowStep: {
      update: jest.fn(),
    },
    feature: {
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

// Helper to create mock workflow steps
function createMockSteps(statuses: WorkflowStepStatus[]): WorkflowStepData[] {
  const stepTypes = ['spec', 'design', 'implement', 'review', 'test', 'submit'] as const;
  return statuses.map((status, index) => ({
    id: `step-${index + 1}`,
    featureId: 'feature-1',
    stepType: stepTypes[index],
    stepOrder: index + 1,
    status,
    agentId: status === 'in_progress' ? `agent-${index}` : null,
    output: status === 'completed' ? `Output for ${stepTypes[index]}` : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

// Helper to create mock feature
function createMockFeature(): FeatureData {
  return {
    id: 'feature-1',
    projectId: 'project-1',
    title: 'Test Feature',
    description: 'A test feature',
    priority: 'medium',
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper to create mock conversation
function createMockConversation(): ConversationMessage[] {
  return [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Create a specification for the feature',
      timestamp: '2025-01-01T00:00:00Z',
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: `# Specification: Test Feature

## Overview
This is a test specification.

## Requirements
1. Requirement 1
2. Requirement 2`,
      timestamp: '2025-01-01T00:01:00Z',
    },
  ];
}

describe('Step Completion Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.workflowStep.update as jest.Mock).mockResolvedValue({});
    (prisma.feature.update as jest.Mock).mockResolvedValue({});
    (prisma.notification.create as jest.Mock).mockResolvedValue({});
  });

  describe('handleStepCompletion', () => {
    it('should complete step and extract output', async () => {
      const steps = createMockSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const feature = createMockFeature();
      const conversation = createMockConversation();

      const result = await handleStepCompletion({
        step: steps[0],
        feature,
        allSteps: steps,
        conversation,
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Specification');
      expect(result.nextStep?.stepType).toBe('design');
      expect(result.notification).not.toBeNull();

      expect(prisma.workflowStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: expect.objectContaining({
          status: 'completed',
          output: expect.stringContaining('Specification'),
        }),
      });
    });

    it('should handle completion of last step', async () => {
      const steps = createMockSteps(['completed', 'completed', 'completed', 'completed', 'completed', 'in_progress']);
      const feature = createMockFeature();
      const conversation: ConversationMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'PR has been finalised and merged. https://github.com/owner/repo/pull/123',
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = await handleStepCompletion({
        step: steps[5],
        feature,
        allSteps: steps,
        conversation,
      });

      expect(result.success).toBe(true);
      expect(result.nextStep).toBeNull();
      expect(result.notification?.type).toBe('workflow_completed');
    });

    it('should handle missing conversation gracefully', async () => {
      const steps = createMockSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const feature = createMockFeature();

      const result = await handleStepCompletion({
        step: steps[0],
        feature,
        allSteps: steps,
        conversation: [],
      });

      expect(result.success).toBe(true);
      expect(result.output).toBeNull();
    });

    it('should return error for invalid step', async () => {
      const steps = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const feature = createMockFeature();

      // Try to complete a step that's not in progress
      const result = await handleStepCompletion({
        step: steps[1], // design step which is pending
        feature,
        allSteps: steps,
        conversation: [],
        validateState: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot complete step');
    });
  });

  describe('createStepCompletedNotification', () => {
    it('should create notification for completed step', () => {
      const step = createMockSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending'])[0];
      const feature = createMockFeature();
      const nextStep = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending'])[1];

      const notification = createStepCompletedNotification(step, feature, nextStep);

      expect(notification.type).toBe('step_completed');
      expect(notification.title).toContain('Specification');
      expect(notification.message).toContain('completed');
      expect(notification.featureId).toBe('feature-1');
      expect(notification.stepId).toBe('step-1');
      expect(notification.actionLabel).toContain('Design');
    });

    it('should handle final step notification', () => {
      const step = createMockSteps(['completed', 'completed', 'completed', 'completed', 'completed', 'in_progress'])[5];
      const feature = createMockFeature();

      const notification = createStepCompletedNotification(step, feature, null);

      expect(notification.type).toBe('step_completed');
      expect(notification.actionLabel).toBeNull();
    });
  });

  describe('createWorkflowCompletedNotification', () => {
    it('should create workflow completed notification', () => {
      const feature = createMockFeature();

      const notification = createWorkflowCompletedNotification(feature);

      expect(notification.type).toBe('workflow_completed');
      expect(notification.title).toContain('Workflow Complete');
      expect(notification.featureId).toBe('feature-1');
    });
  });

  describe('updateStepStatus', () => {
    it('should update step status in database', async () => {
      await updateStepStatus('step-1', 'completed', 'Test output');

      expect(prisma.workflowStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          status: 'completed',
          output: 'Test output',
        },
      });
    });

    it('should update without output', async () => {
      await updateStepStatus('step-1', 'in_progress');

      expect(prisma.workflowStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          status: 'in_progress',
          output: undefined,
        },
      });
    });
  });

  describe('storeStepOutput', () => {
    it('should store output in database', async () => {
      await storeStepOutput('step-1', 'Test output content');

      expect(prisma.workflowStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          output: 'Test output content',
        },
      });
    });
  });
});
