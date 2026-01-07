/**
 * API Route for Marking Notification as Read
 * 
 * PUT /api/notifications/:id/read - Mark notification as read
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
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
export async function PUT(
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

    // Update the notification
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: transformNotification(notification) });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
