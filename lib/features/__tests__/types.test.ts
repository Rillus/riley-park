/**
 * Tests for Feature types and validation schemas
 */

import {
  createFeatureSchema,
  updateFeatureSchema,
  updateWorkflowStepSchema,
  Priority,
  FeatureStatus,
  StepType,
  WorkflowStepStatus,
  WORKFLOW_STEPS_ORDER,
} from '../types';

describe('createFeatureSchema', () => {
  it('should validate a valid feature input', () => {
    const validInput = {
      projectId: 'project-123',
      title: 'Test Feature',
      description: 'A test feature description',
      priority: 'high',
    };

    const result = createFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Test Feature');
      expect(result.data.projectId).toBe('project-123');
      expect(result.data.priority).toBe('high');
    }
  });

  it('should validate a feature with minimal required fields', () => {
    const validInput = {
      projectId: 'project-123',
      title: 'Test Feature',
      description: 'A test feature description',
    };

    const result = createFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('medium'); // Default value
    }
  });

  it('should reject empty title', () => {
    const invalidInput = {
      projectId: 'project-123',
      title: '',
      description: 'A test feature description',
    };

    const result = createFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required');
    }
  });

  it('should reject missing title', () => {
    const invalidInput = {
      projectId: 'project-123',
      description: 'A test feature description',
    };

    const result = createFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty description', () => {
    const invalidInput = {
      projectId: 'project-123',
      title: 'Test Feature',
      description: '',
    };

    const result = createFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description is required');
    }
  });

  it('should reject missing projectId', () => {
    const invalidInput = {
      title: 'Test Feature',
      description: 'A test feature description',
    };

    const result = createFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid priority', () => {
    const invalidInput = {
      projectId: 'project-123',
      title: 'Test Feature',
      description: 'A test feature description',
      priority: 'invalid-priority',
    };

    const result = createFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should accept all valid priorities', () => {
    const priorities = ['high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const result = createFeatureSchema.safeParse({
        projectId: 'project-123',
        title: 'Test Feature',
        description: 'A test feature description',
        priority,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject title that is too long', () => {
    const invalidInput = {
      projectId: 'project-123',
      title: 'a'.repeat(256),
      description: 'A test feature description',
    };

    const result = createFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is too long');
    }
  });

  it('should reject description that is too long', () => {
    const invalidInput = {
      projectId: 'project-123',
      title: 'Test Feature',
      description: 'a'.repeat(5001),
    };

    const result = createFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description is too long');
    }
  });
});

describe('updateFeatureSchema', () => {
  it('should validate partial update with only title', () => {
    const validInput = {
      title: 'Updated Feature Title',
    };

    const result = updateFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate partial update with only description', () => {
    const validInput = {
      description: 'Updated description',
    };

    const result = updateFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate partial update with only priority', () => {
    const validInput = {
      priority: 'high',
    };

    const result = updateFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate partial update with only status', () => {
    const validInput = {
      status: 'in_progress',
    };

    const result = updateFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate empty object (no changes)', () => {
    const validInput = {};

    const result = updateFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid priority in update', () => {
    const invalidInput = {
      priority: 'invalid',
    };

    const result = updateFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid status in update', () => {
    const invalidInput = {
      status: 'invalid',
    };

    const result = updateFeatureSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should accept all valid statuses', () => {
    const statuses = ['planned', 'in_progress', 'completed', 'blocked'];
    
    for (const status of statuses) {
      const result = updateFeatureSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('should validate full update', () => {
    const validInput = {
      title: 'Updated Feature',
      description: 'Updated description',
      priority: 'low',
      status: 'completed',
    };

    const result = updateFeatureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
});

describe('updateWorkflowStepSchema', () => {
  it('should validate status update', () => {
    const validInput = {
      status: 'completed',
    };

    const result = updateWorkflowStepSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate agentId update', () => {
    const validInput = {
      agentId: 'agent-123',
    };

    const result = updateWorkflowStepSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate output update', () => {
    const validInput = {
      output: 'Step output content',
    };

    const result = updateWorkflowStepSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should allow null agentId to clear it', () => {
    const validInput = {
      agentId: null,
    };

    const result = updateWorkflowStepSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should allow null output to clear it', () => {
    const validInput = {
      output: null,
    };

    const result = updateWorkflowStepSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate empty object (no changes)', () => {
    const validInput = {};

    const result = updateWorkflowStepSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept all valid workflow step statuses', () => {
    const statuses = ['pending', 'in_progress', 'completed', 'blocked'];
    
    for (const status of statuses) {
      const result = updateWorkflowStepSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const invalidInput = {
      status: 'invalid',
    };

    const result = updateWorkflowStepSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('Priority enum', () => {
  it('should have all expected values', () => {
    expect(Priority.HIGH).toBe('high');
    expect(Priority.MEDIUM).toBe('medium');
    expect(Priority.LOW).toBe('low');
  });
});

describe('FeatureStatus enum', () => {
  it('should have all expected values', () => {
    expect(FeatureStatus.PLANNED).toBe('planned');
    expect(FeatureStatus.IN_PROGRESS).toBe('in_progress');
    expect(FeatureStatus.COMPLETED).toBe('completed');
    expect(FeatureStatus.BLOCKED).toBe('blocked');
  });
});

describe('StepType enum', () => {
  it('should have all expected values', () => {
    expect(StepType.SPEC).toBe('spec');
    expect(StepType.DESIGN).toBe('design');
    expect(StepType.IMPLEMENT).toBe('implement');
    expect(StepType.REVIEW).toBe('review');
    expect(StepType.TEST).toBe('test');
    expect(StepType.SUBMIT).toBe('submit');
  });
});

describe('WorkflowStepStatus enum', () => {
  it('should have all expected values', () => {
    expect(WorkflowStepStatus.PENDING).toBe('pending');
    expect(WorkflowStepStatus.IN_PROGRESS).toBe('in_progress');
    expect(WorkflowStepStatus.COMPLETED).toBe('completed');
    expect(WorkflowStepStatus.BLOCKED).toBe('blocked');
  });
});

describe('WORKFLOW_STEPS_ORDER', () => {
  it('should have the correct order', () => {
    expect(WORKFLOW_STEPS_ORDER).toEqual([
      'spec',
      'design',
      'implement',
      'review',
      'test',
      'submit',
    ]);
  });

  it('should have 6 steps', () => {
    expect(WORKFLOW_STEPS_ORDER.length).toBe(6);
  });
});
