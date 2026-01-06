/**
 * API Routes for Notification Management
 * 
 * GET /api/notifications - List notifications (unread first)
 * POST /api/notifications - Create a new notification (internal use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  createNotificationSchema,
  notificationQuerySchema,
  NotificationType,
  Notification,
  NotificationListResponse,
} from '@/lib/notifications/types';

/**
 * Transform Prisma notification to API response format
 */
function transformNotification(dbNotification: {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  metadata: string | null;
  createdAt: Date;
}): Notification {
  return {
    id: dbNotification.id,
    userId: dbNotification.userId,
    type: dbNotification.type as NotificationType,
    title: dbNotification.title,
    message: dbNotification.message,
    read: dbNotification.read,
    actionUrl: dbNotification.actionUrl,
    metadata: dbNotification.metadata
      ? (JSON.parse(dbNotification.metadata) as Record<string, unknown>)
      : null,
    createdAt: dbNotification.createdAt,
  };
}

/**
 * GET /api/notifications
 * List notifications with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate query parameters
    const queryResult = notificationQuerySchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      unreadOnly: searchParams.get('unreadOnly'),
      type: searchParams.get('type'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { limit, offset, unreadOnly, type } = queryResult.data;

    // Build where clause
    const where: {
      read?: boolean;
      type?: string;
    } = {};
    
    if (unreadOnly) {
      where.read = false;
    }
    
    if (type) {
      where.type = type;
    }

    // Fetch notifications ordered by: unread first, then by creation date
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { read: 'asc' }, // Unread first
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { read: false } }),
    ]);

    const response: NotificationListResponse = {
      notifications: notifications.map(transformNotification),
      total,
      unreadCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification (typically used internally by the notification service)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createNotificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { type, title, message, actionUrl, metadata, userId } = validationResult.data;

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        actionUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
        userId,
      },
    });

    return NextResponse.json(
      { notification: transformNotification(notification) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
