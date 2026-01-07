/**
 * Tests for NotificationDropdown component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import NotificationDropdown from '../NotificationDropdown';
import { Notification } from '@/lib/notifications/types';

describe('NotificationDropdown', () => {
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      type: 'agent_finished',
      title: 'Agent Completed',
      message: 'Agent has finished the task.',
      read: false,
      actionUrl: '/agents/1/conversation',
      metadata: null,
      createdAt: new Date('2026-01-06T12:00:00Z'),
      userId: null,
    },
    {
      id: 'notif-2',
      type: 'pr_created',
      title: 'PR Created',
      message: 'A new pull request has been created.',
      read: true,
      actionUrl: 'https://github.com/user/repo/pull/123',
      metadata: null,
      createdAt: new Date('2026-01-06T11:00:00Z'),
      userId: null,
    },
  ];

  it('should render notification list', () => {
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Agent Completed')).toBeInTheDocument();
    expect(screen.getByText('PR Created')).toBeInTheDocument();
  });

  it('should render empty state when no notifications', () => {
    render(
      <NotificationDropdown
        notifications={[]}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <NotificationDropdown
        notifications={[]}
        loading={true}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should call onMarkAsRead when marking notification as read', () => {
    const onMarkAsRead = jest.fn();
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={onMarkAsRead}
        onDismiss={jest.fn()}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const markAsReadButtons = screen.getAllByLabelText(/mark as read/i);
    fireEvent.click(markAsReadButtons[0]);

    expect(onMarkAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('should call onDismiss when dismissing notification', () => {
    const onDismiss = jest.fn();
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={jest.fn()}
        onDismiss={onDismiss}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const dismissButtons = screen.getAllByLabelText(/dismiss/i);
    fireEvent.click(dismissButtons[0]);

    expect(onDismiss).toHaveBeenCalledWith('notif-1');
  });

  it('should call onClearAll when clicking clear all button', () => {
    const onClearAll = jest.fn();
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
        onClearAll={onClearAll}
        onClose={jest.fn()}
      />
    );

    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllButton);

    expect(onClearAll).toHaveBeenCalled();
  });

  it('should have header with title', () => {
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/notifications/i)).toBeInTheDocument();
  });

  it('should show unread count in header', () => {
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        unreadCount={1}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
  });
});
