'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Notification, NotificationListResponse } from './types';

interface UseNotificationsOptions {
  /**
   * Polling interval in milliseconds. Set to 0 to disable polling.
   * Default: 5000 (5 seconds)
   */
  pollInterval?: number;
  /**
   * Maximum number of notifications to fetch
   * Default: 50
   */
  limit?: number;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

/**
 * Hook for managing notifications with polling
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  // Memoize options to prevent unnecessary re-renders
  const pollInterval = useMemo(() => options.pollInterval ?? 5000, [options.pollInterval]);
  const limit = useMemo(() => options.limit ?? 50, [options.limit]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch notifications from the API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?limit=${limit}&offset=0`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: NotificationListResponse = await response.json();
      
      // Parse dates from JSON
      const parsedNotifications = data.notifications.map((n) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));

      setNotifications(parsedNotifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (err) {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
      console.error('Error marking notification as read:', err);
    }
  }, []);

  /**
   * Dismiss a notification
   */
  const dismiss = useCallback(async (id: string) => {
    // Optimistic update
    const previousNotifications = notifications;
    const wasUnread = notifications.find((n) => n.id === id)?.read === false;
    
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }
    } catch (err) {
      // Revert on error
      setNotifications(previousNotifications);
      if (wasUnread) {
        setUnreadCount((prev) => prev + 1);
      }
      console.error('Error dismissing notification:', err);
    }
  }, [notifications]);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async () => {
    // Optimistic update
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications([]);
    setUnreadCount(0);

    try {
      const response = await fetch('/api/notifications/clear', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }
    } catch (err) {
      // Revert on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      console.error('Error clearing notifications:', err);
    }
  }, [notifications, unreadCount]);

  /**
   * Manually refresh notifications
   */
  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up polling
  useEffect(() => {
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchNotifications, pollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    dismiss,
    clearAll,
  };
}
