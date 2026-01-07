/**
 * API Route for Clearing All Notifications
 * 
 * POST /api/notifications/clear - Clear all notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ClearNotificationsResponse } from '@/lib/notifications/types';

/**
 * POST /api/notifications/clear
 * Clear all notifications (delete or mark as read based on query param)
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const markAsRead = searchParams.get('markAsRead') === 'true';

    let clearedCount: number;

    if (markAsRead) {
      // Mark all unread notifications as read
      const result = await prisma.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      clearedCount = result.count;
    } else {
      // Delete all notifications
      const result = await prisma.notification.deleteMany({});
      clearedCount = result.count;
    }

    const response: ClearNotificationsResponse = {
      clearedCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
