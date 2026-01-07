/**
 * Notifications API
 * GET /api/notifications - List notifications
 * POST /api/notifications/mark-read - Mark notifications as read
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { read: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, notificationIds, all } = body;

    if (action === 'mark-read') {
      if (all) {
        // Mark all as read
        await prisma.notification.updateMany({
          where: { read: false },
          data: { read: true },
        });
        return NextResponse.json({ success: true, message: 'All notifications marked as read' });
      }

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: 'notificationIds array is required' },
          { status: 400 }
        );
      }

      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds } },
        data: { read: true },
      });

      return NextResponse.json({ success: true, marked: notificationIds.length });
    }

    if (action === 'delete') {
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: 'notificationIds array is required' },
          { status: 400 }
        );
      }

      await prisma.notification.deleteMany({
        where: { id: { in: notificationIds } },
      });

      return NextResponse.json({ success: true, deleted: notificationIds.length });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use mark-read or delete' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing notification action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
