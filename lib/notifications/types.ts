/**
 * Types for Notification System
 */

import { z } from 'zod';

// Notification types enum
export const NotificationTypes = [
  'agent_finished',
  'agent_needs_input',
  'pr_created',
  'pr_review_ready',
  'step_complete',
  'error',
] as const;

export type NotificationType = (typeof NotificationTypes)[number];

// Zod schemas for validation
export const createNotificationSchema = z.object({
  type: z.enum(NotificationTypes),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message is too long'),
  actionUrl: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  userId: z.string().optional(),
});

export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
});

export const notificationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  unreadOnly: z.coerce.boolean().optional().default(false),
  type: z.enum(NotificationTypes).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;

// Notification type matching the database model
export interface Notification {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// API response types
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationResponse {
  notification: Notification;
}

export interface NotificationErrorResponse {
  error: string;
  details?: unknown;
}

export interface NotificationCountResponse {
  unreadCount: number;
}

export interface ClearNotificationsResponse {
  clearedCount: number;
}
