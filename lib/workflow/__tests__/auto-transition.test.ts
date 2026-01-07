/**
 * Tests for Auto-Transition Logic
 */

import {
  shouldAutoTransition,
  executeAutoTransition,
  getAutoTransitionPrompt,
  validatePreviousStepOutput,
  getWorkflowSettings,
  updateWorkflowSettings,
} from '../auto-transition';
import { WorkflowStepData, FeatureData, WorkflowStepStatus } from '../types';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    workflowSettings: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    workflowStep: {
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
    launchAgent: jest.fn(),
  })),
}));

import { prisma } from '@/lib/db';
import { CursorAPIClient } from '@/lib/cursor-api';

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
function createMockFeature(overrides: Partial<FeatureData> = {}): FeatureData {
  return {
    id: 'feature-1',
    projectId: 'project-1',
    title: 'Test Feature',
    description: 'A test feature description',
    priority: 'medium',
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Auto-Transition Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.workflowStep.update as jest.Mock).mockResolvedValue({});
    (prisma.notification.create as jest.Mock).mockResolvedValue({});
  });

  describe('shouldAutoTransition', () => {
    it('should return true when auto-transition is enabled and conditions are met', async () => {
      const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
      // Ensure completed step has valid output with requirements section
      steps[0].output = '# Specification\n\n## Requirements\n- Feature 1';
      const completedStep = steps[0];
      const nextStep = steps[1];

      (prisma.workflowSettings.findFirst as jest.Mock).mockResolvedValue({
        autoTransition: true,
        pollingInterval: 5000,
      });

      const result = await shouldAutoTransition(completedStep, nextStep, steps);

      expect(result).toBe(true);
    });

    it('should return false when auto-transition is disabled', async () => {
      const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
      const completedStep = steps[0];
      const nextStep = steps[1];

      (prisma.workflowSettings.findFirst as jest.Mock).mockResolvedValue({
        autoTransition: false,
        pollingInterval: 5000,
      });

      const result = await shouldAutoTransition(completedStep, nextStep, steps);

      expect(result).toBe(false);
    });

    it('should return false when there is no next step', async () => {
      const steps = createMockSteps(['completed', 'completed', 'completed', 'completed', 'completed', 'completed']);
      const completedStep = steps[5];

      (prisma.workflowSettings.findFirst as jest.Mock).mockResolvedValue({
        autoTransition: true,
      });

      const result = await shouldAutoTransition(completedStep, null, steps);

      expect(result).toBe(false);
    });

    it('should return false when previous step has no output', async () => {
      const steps = createMockSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending']);
      steps[0].output = null; // Remove output
      const completedStep = steps[0];
      const nextStep = steps[1];

      (prisma.workflowSettings.findFirst as jest.Mock).mockResolvedValue({
        autoTransition: true,
      });

      const result = await shouldAutoTransition(completedStep, nextStep, steps);

      expect(result).toBe(false);
    });

    it('should return false when next step is not pending', async () => {
      const steps = createMockSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']);
      const completedStep = steps[0];
      const nextStep = steps[1];

      (prisma.workflowSettings.findFirst as jest.Mock).mockResolvedValue({
        autoTransition: true,
      });

      const result = await shouldAutoTransition(completedStep, nextStep, steps);

      expect(result).toBe(false);
    });
  });

  describe('executeAutoTransition', () => {
    it('should launch agent for next step', async () => {
      const feature = createMockFeature();
      const nextStep = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending'])[1];
      const previousOutput = '# Specification\n\nTest specification content';

      const mockClient = new CursorAPIClient('test-key');
      (mockClient.launchAgent as jest.Mock).mockResolvedValue({
        id: 'new-agent-123',
        status: 'RUNNING',
      });

      const result = await executeAutoTransition(
        mockClient,
        feature,
        nextStep,
        previousOutput,
        'https://github.com/test/repo'
      );

      expect(result.success).toBe(true);
      expect(result.agentId).toBe('new-agent-123');
      expect(mockClient.launchAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          repository: 'https://github.com/test/repo',
          prompt: expect.stringContaining('design'),
        })
      );
      expect(prisma.workflowStep.update).toHaveBeenCalledWith({
        where: { id: nextStep.id },
        data: {
          status: 'in_progress',
          agentId: 'new-agent-123',
        },
      });
    });

    it('should handle launch failure', async () => {
      const feature = createMockFeature();
      const nextStep = createMockSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending'])[1];

      const mockClient = new CursorAPIClient('test-key');
      (mockClient.launchAgent as jest.Mock).mockRejectedValue(new Error('Launch failed'));

      const result = await executeAutoTransition(
        mockClient,
        feature,
        nextStep,
        'Previous output',
        'https://github.com/test/repo'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Launch failed');
    });
  });

  describe('getAutoTransitionPrompt', () => {
    it('should generate prompt for design step', () => {
      const feature = createMockFeature();
      const previousOutput = '# Specification\n\n## Requirements\n- Feature 1';

      const prompt = getAutoTransitionPrompt(feature, 'design', previousOutput);

      expect(prompt).toContain('design');
      expect(prompt).toContain(feature.title);
      expect(prompt).toContain('Specification');
    });

    it('should generate prompt for implement step', () => {
      const feature = createMockFeature();
      const previousOutput = '# Design Document\n\n## Architecture\nMicroservices';

      const prompt = getAutoTransitionPrompt(feature, 'implement', previousOutput);

      expect(prompt.toLowerCase()).toContain('implement');
      expect(prompt).toContain(feature.title);
    });

    it('should generate prompt for review step', () => {
      const feature = createMockFeature();
      const previousOutput = 'Implementation complete';

      const prompt = getAutoTransitionPrompt(feature, 'review', previousOutput);

      expect(prompt.toLowerCase()).toContain('review');
    });

    it('should generate prompt for test step', () => {
      const feature = createMockFeature();

      const prompt = getAutoTransitionPrompt(feature, 'test', 'Code reviewed');

      expect(prompt).toContain('test');
    });

    it('should generate prompt for submit step', () => {
      const feature = createMockFeature();

      const prompt = getAutoTransitionPrompt(feature, 'submit', 'Tests passed');

      expect(prompt).toContain('submit');
      expect(prompt).toContain('PR');
    });
  });

  describe('validatePreviousStepOutput', () => {
    it('should validate output is present', () => {
      // Output needs to have valid content for the step type
      expect(validatePreviousStepOutput('## Requirements\n- Item', 'spec')).toBe(true);
      expect(validatePreviousStepOutput(null, 'spec')).toBe(false);
      expect(validatePreviousStepOutput('', 'spec')).toBe(false);
    });

    it('should validate spec output has required sections', () => {
      const validOutput = '# Specification\n\n## Requirements\n- Item 1';
      const invalidOutput = 'Just some text';

      expect(validatePreviousStepOutput(validOutput, 'spec')).toBe(true);
      expect(validatePreviousStepOutput(invalidOutput, 'spec')).toBe(false);
    });

    it('should validate design output has required sections', () => {
      const validOutput = '# Design\n\n## Architecture\nMicroservices';
      const invalidOutput = 'Just some text';

      expect(validatePreviousStepOutput(validOutput, 'design')).toBe(true);
      expect(validatePreviousStepOutput(invalidOutput, 'design')).toBe(false);
    });
  });

  describe('getWorkflowSettings', () => {
    it('should return settings from database', async () => {
      const mockSettings = {
        id: 'settings-1',
        autoTransition: true,
        pollingInterval: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.workflowSettings.findFirst as jest.Mock).mockResolvedValue(mockSettings);

      const settings = await getWorkflowSettings();

      expect(settings.autoTransition).toBe(true);
      expect(settings.pollingInterval).toBe(10000);
    });

    it('should return defaults when no settings exist', async () => {
      (prisma.workflowSettings.findFirst as jest.Mock).mockResolvedValue(null);

      const settings = await getWorkflowSettings();

      expect(settings.autoTransition).toBe(false);
      expect(settings.pollingInterval).toBe(5000);
    });
  });

  describe('updateWorkflowSettings', () => {
    it('should update settings in database', async () => {
      (prisma.workflowSettings.upsert as jest.Mock).mockResolvedValue({
        id: 'settings-1',
        autoTransition: true,
        pollingInterval: 10000,
      });

      await updateWorkflowSettings({ autoTransition: true, pollingInterval: 10000 });

      expect(prisma.workflowSettings.upsert).toHaveBeenCalledWith({
        where: { id: 'default' },
        update: { autoTransition: true, pollingInterval: 10000 },
        create: { id: 'default', autoTransition: true, pollingInterval: 10000 },
      });
    });
  });
});
