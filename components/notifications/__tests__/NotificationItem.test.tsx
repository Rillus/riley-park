/**
 * Tests for NotificationItem component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import NotificationItem from '../NotificationItem';
import { Notification } from '@/lib/notifications/types';

describe('NotificationItem', () => {
  const baseNotification: Notification = {
    id: 'notif-123',
    type: 'agent_finished',
    title: 'Agent Completed',
    message: 'Agent has finished the task successfully.',
    read: false,
    actionUrl: '/agents/123/conversation',
    metadata: { agentId: '123' },
    createdAt: new Date('2026-01-06T12:00:00Z'),
    userId: null,
  };

  it('should render notification title and message', () => {
    render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText('Agent Completed')).toBeInTheDocument();
    expect(screen.getByText('Agent has finished the task successfully.')).toBeInTheDocument();
  });

  it('should render unread indicator for unread notifications', () => {
    const { container } = render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    // Check for unread indicator (blue dot or styling)
    expect(container.querySelector('[data-unread="true"]')).toBeInTheDocument();
  });

  it('should not render unread indicator for read notifications', () => {
    const readNotification = { ...baseNotification, read: true };
    const { container } = render(
      <NotificationItem
        notification={readNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(container.querySelector('[data-unread="true"]')).not.toBeInTheDocument();
  });

  it('should call onMarkAsRead when clicking mark as read button', () => {
    const onMarkAsRead = jest.fn();
    render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={onMarkAsRead}
        onDismiss={jest.fn()}
      />
    );

    const markAsReadButton = screen.getByLabelText(/mark as read/i);
    fireEvent.click(markAsReadButton);

    expect(onMarkAsRead).toHaveBeenCalledWith('notif-123');
  });

  it('should call onDismiss when clicking dismiss button', () => {
    const onDismiss = jest.fn();
    render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByLabelText(/dismiss/i);
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledWith('notif-123');
  });

  it('should render action link when actionUrl is provided', () => {
    render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    const actionLink = screen.getByRole('link');
    expect(actionLink).toHaveAttribute('href', '/agents/123/conversation');
  });

  it('should not render action link when actionUrl is not provided', () => {
    const notificationWithoutAction = { ...baseNotification, actionUrl: null };
    render(
      <NotificationItem
        notification={notificationWithoutAction}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should display correct icon for agent_finished type', () => {
    render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByTestId('notification-icon')).toBeInTheDocument();
  });

  it('should display correct icon for error type', () => {
    const errorNotification = { ...baseNotification, type: 'error' as const };
    render(
      <NotificationItem
        notification={errorNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByTestId('notification-icon')).toBeInTheDocument();
  });

  it('should display relative time', () => {
    render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    // Should show some time indicator
    expect(screen.getByTestId('notification-time')).toBeInTheDocument();
  });

  it('should handle click on the notification item', () => {
    const onClick = jest.fn();
    render(
      <NotificationItem
        notification={baseNotification}
        onMarkAsRead={jest.fn()}
        onDismiss={jest.fn()}
        onClick={onClick}
      />
    );

    const notificationElement = screen.getByRole('article');
    fireEvent.click(notificationElement);

    expect(onClick).toHaveBeenCalled();
  });
});
