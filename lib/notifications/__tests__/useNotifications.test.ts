/**
 * Tests for useNotifications hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useNotifications', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'agent_finished',
      title: 'Agent Completed',
      message: 'Agent has finished',
      read: false,
      actionUrl: '/agents/1',
      metadata: null,
      createdAt: '2026-01-06T12:00:00Z',
      userId: null,
    },
    {
      id: 'notif-2',
      type: 'pr_created',
      title: 'PR Created',
      message: 'PR has been created',
      read: true,
      actionUrl: 'https://github.com/user/repo/pull/1',
      metadata: null,
      createdAt: '2026-01-06T11:00:00Z',
      userId: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          notifications: mockNotifications,
          total: 2,
          unreadCount: 1,
        }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch notifications on mount', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications?limit=50&offset=0');
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('should set loading state while fetching', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useNotifications());

    expect(result.current.loading).toBe(true);
  });

  it('should handle fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should poll for new notifications', async () => {
    const { result } = renderHook(() => useNotifications({ pollInterval: 5000 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should not poll when polling is disabled', async () => {
    const { result } = renderHook(() => useNotifications({ pollInterval: 0 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should still be 1
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should mark notification as read', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            notifications: mockNotifications,
            total: 2,
            unreadCount: 1,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notification: { ...mockNotifications[0], read: true } }),
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead('notif-1');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/notif-1/read', {
      method: 'PUT',
    });
  });

  it('should dismiss notification', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            notifications: mockNotifications,
            total: 2,
            unreadCount: 1,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.dismiss('notif-1');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/notif-1', {
      method: 'DELETE',
    });

    // Notification should be removed from list
    expect(result.current.notifications).toHaveLength(1);
  });

  it('should clear all notifications', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            notifications: mockNotifications,
            total: 2,
            unreadCount: 1,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ clearedCount: 2 }),
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.clearAll();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/notifications/clear', {
      method: 'POST',
    });

    // All notifications should be cleared
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should refresh notifications', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should optimistically update on mark as read', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock the PUT request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ notification: { ...mockNotifications[0], read: true } }),
    });

    // Check initial state
    expect(result.current.notifications[0].read).toBe(false);
    expect(result.current.unreadCount).toBe(1);

    act(() => {
      result.current.markAsRead('notif-1');
    });

    // Should optimistically update
    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });
});
