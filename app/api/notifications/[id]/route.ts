/**
 * API Routes for Individual Notification
 * 
 * GET /api/notifications/:id - Get a single notification
 * DELETE /api/notifications/:id - Dismiss/delete a notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { NotificationType, Notification } from '@/lib/notifications/types';

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/notifications/:id
 * Get a single notification by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification: transformNotification(notification) });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/:id
 * Dismiss/delete a notification
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
