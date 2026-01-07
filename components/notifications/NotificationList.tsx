'use client';

import { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import { NotificationData } from '@/lib/workflow/types';

interface NotificationListProps {
  limit?: number;
  unreadOnly?: boolean;
  onNotificationRead?: () => void;
}

export default function NotificationList({
  limit = 20,
  unreadOnly = false,
  onNotificationRead,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());
      if (unreadOnly) params.set('unreadOnly', 'true');

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(
        data.notifications.map((n: Record<string, unknown>) => ({
          ...n,
          createdAt: new Date(n.createdAt as string),
        }))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [limit, unreadOnly]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark-read',
          notificationIds: [id],
        }),
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      // Notify parent
      onNotificationRead?.();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin inline-block h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full mb-2" />
        <p className="text-sm">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchNotifications}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={handleMarkRead}
        />
      ))}
    </div>
  );
}
