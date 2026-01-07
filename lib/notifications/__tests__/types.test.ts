/**
 * Tests for Notification types and validation schemas
 */

import {
  createNotificationSchema,
  updateNotificationSchema,
  notificationQuerySchema,
  NotificationType,
  Notification,
} from '../types';

describe('NotificationType', () => {
  it('should have all required notification types', () => {
    const types: NotificationType[] = [
      'agent_finished',
      'agent_needs_input',
      'pr_created',
      'pr_review_ready',
      'step_complete',
      'error',
    ];

    types.forEach((type) => {
      expect(typeof type).toBe('string');
    });
  });
});

describe('createNotificationSchema', () => {
  it('should validate a valid notification input', () => {
    const validInput = {
      type: 'agent_finished',
      title: 'Agent Completed',
      message: 'Agent has finished the task',
      actionUrl: '/agents/123',
      metadata: { agentId: '123' },
    };

    const result = createNotificationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('agent_finished');
      expect(result.data.title).toBe('Agent Completed');
      expect(result.data.message).toBe('Agent has finished the task');
      expect(result.data.actionUrl).toBe('/agents/123');
      expect(result.data.metadata).toEqual({ agentId: '123' });
    }
  });

  it('should validate notification with minimal required fields', () => {
    const validInput = {
      type: 'error',
      title: 'Error Occurred',
      message: 'Something went wrong',
    };

    const result = createNotificationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actionUrl).toBeUndefined();
      expect(result.data.metadata).toBeUndefined();
    }
  });

  it('should reject invalid notification type', () => {
    const invalidInput = {
      type: 'invalid_type',
      title: 'Test',
      message: 'Test message',
    };

    const result = createNotificationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const invalidInput = {
      type: 'agent_finished',
      title: '',
      message: 'Test message',
    };

    const result = createNotificationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required');
    }
  });

  it('should reject empty message', () => {
    const invalidInput = {
      type: 'agent_finished',
      title: 'Test',
      message: '',
    };

    const result = createNotificationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Message is required');
    }
  });

  it('should reject title that is too long', () => {
    const invalidInput = {
      type: 'agent_finished',
      title: 'a'.repeat(256),
      message: 'Test message',
    };

    const result = createNotificationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is too long');
    }
  });

  it('should reject message that is too long', () => {
    const invalidInput = {
      type: 'agent_finished',
      title: 'Test',
      message: 'a'.repeat(5001),
    };

    const result = createNotificationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Message is too long');
    }
  });

  it('should accept all valid notification types', () => {
    const types = [
      'agent_finished',
      'agent_needs_input',
      'pr_created',
      'pr_review_ready',
      'step_complete',
      'error',
    ];

    types.forEach((type) => {
      const result = createNotificationSchema.safeParse({
        type,
        title: 'Test',
        message: 'Test message',
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept optional userId', () => {
    const validInput = {
      type: 'agent_finished',
      title: 'Test',
      message: 'Test message',
      userId: 'user-123',
    };

    const result = createNotificationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('user-123');
    }
  });
});

describe('updateNotificationSchema', () => {
  it('should validate updating read status', () => {
    const validInput = {
      read: true,
    };

    const result = updateNotificationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.read).toBe(true);
    }
  });

  it('should validate empty object (no changes)', () => {
    const validInput = {};

    const result = updateNotificationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid read value', () => {
    const invalidInput = {
      read: 'yes',
    };

    const result = updateNotificationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('notificationQuerySchema', () => {
  it('should validate default query parameters', () => {
    const validInput = {};

    const result = notificationQuerySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
      expect(result.data.unreadOnly).toBe(false);
    }
  });

  it('should validate custom query parameters', () => {
    const validInput = {
      limit: 10,
      offset: 20,
      unreadOnly: true,
      type: 'agent_finished',
    };

    const result = notificationQuerySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(20);
      expect(result.data.unreadOnly).toBe(true);
      expect(result.data.type).toBe('agent_finished');
    }
  });

  it('should coerce string numbers to numbers', () => {
    const validInput = {
      limit: '25',
      offset: '5',
    };

    const result = notificationQuerySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
      expect(result.data.offset).toBe(5);
    }
  });

  it('should coerce string boolean to boolean', () => {
    const validInput = {
      unreadOnly: 'true',
    };

    const result = notificationQuerySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unreadOnly).toBe(true);
    }
  });

  it('should reject invalid type filter', () => {
    const invalidInput = {
      type: 'invalid_type',
    };

    const result = notificationQuerySchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject negative limit', () => {
    const invalidInput = {
      limit: -1,
    };

    const result = notificationQuerySchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject limit greater than 100', () => {
    const invalidInput = {
      limit: 101,
    };

    const result = notificationQuerySchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject negative offset', () => {
    const invalidInput = {
      offset: -1,
    };

    const result = notificationQuerySchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('Notification interface', () => {
  it('should have correct structure', () => {
    const notification: Notification = {
      id: 'notif-123',
      type: 'agent_finished',
      title: 'Agent Completed',
      message: 'Agent has finished the task',
      read: false,
      actionUrl: '/agents/123',
      metadata: { agentId: '123' },
      createdAt: new Date(),
      userId: null,
    };

    expect(notification.id).toBe('notif-123');
    expect(notification.type).toBe('agent_finished');
    expect(notification.title).toBe('Agent Completed');
    expect(notification.message).toBe('Agent has finished the task');
    expect(notification.read).toBe(false);
    expect(notification.actionUrl).toBe('/agents/123');
    expect(notification.metadata).toEqual({ agentId: '123' });
    expect(notification.createdAt).toBeInstanceOf(Date);
    expect(notification.userId).toBeNull();
  });
});
