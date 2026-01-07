/**
 * Tests for NotificationItem component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import NotificationItem from '../NotificationItem';
import { NotificationData } from '@/lib/workflow/types';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

function createMockNotification(
  overrides: Partial<NotificationData> = {}
): NotificationData {
  return {
    id: 'notif-1',
    type: 'step_completed',
    title: 'Step Completed',
    message: 'The specification step has been completed.',
    featureId: 'feature-1',
    stepId: 'step-1',
    agentId: 'agent-1',
    read: false,
    actionUrl: '/features/feature-1',
    actionLabel: 'View Feature',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('NotificationItem', () => {
  it('renders notification with title and message', () => {
    const notification = createMockNotification();
    render(<NotificationItem notification={notification} />);

    expect(screen.getByText('Step Completed')).toBeInTheDocument();
    expect(
      screen.getByText('The specification step has been completed.')
    ).toBeInTheDocument();
  });

  it('renders unread notification with highlight', () => {
    const notification = createMockNotification({ read: false });
    const { container } = render(<NotificationItem notification={notification} />);

    // Find the outer container with the bg-blue-50 class
    const highlightedElement = container.querySelector('.bg-blue-50');
    expect(highlightedElement).toBeInTheDocument();
  });

  it('renders read notification without highlight', () => {
    const notification = createMockNotification({ read: true });
    const { container } = render(<NotificationItem notification={notification} />);

    // Ensure no bg-blue-50 class is present
    const highlightedElement = container.querySelector('.bg-blue-50');
    expect(highlightedElement).not.toBeInTheDocument();
  });

  it('renders action button when actionLabel is provided', () => {
    const notification = createMockNotification({
      actionLabel: 'Start Next Step',
      actionUrl: '/features/1?step=design',
    });
    render(<NotificationItem notification={notification} />);

    expect(screen.getByText('Start Next Step')).toBeInTheDocument();
  });

  it('calls onMarkRead when clicked', () => {
    const onMarkRead = jest.fn();
    const notification = createMockNotification({ read: false });
    render(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />
    );

    fireEvent.click(screen.getByText('Step Completed'));
    expect(onMarkRead).toHaveBeenCalledWith('notif-1');
  });

  it('does not call onMarkRead for already read notifications', () => {
    const onMarkRead = jest.fn();
    const notification = createMockNotification({ read: true });
    render(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />
    );

    fireEvent.click(screen.getByText('Step Completed'));
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it('renders correct icon for step_completed type', () => {
    const notification = createMockNotification({ type: 'step_completed' });
    const { container } = render(
      <NotificationItem notification={notification} />
    );

    expect(container.querySelector('.text-green-500')).toBeInTheDocument();
  });

  it('renders correct icon for step_failed type', () => {
    const notification = createMockNotification({ type: 'step_failed' });
    const { container } = render(
      <NotificationItem notification={notification} />
    );

    expect(container.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('renders correct icon for workflow_completed type', () => {
    const notification = createMockNotification({ type: 'workflow_completed' });
    const { container } = render(
      <NotificationItem notification={notification} />
    );

    expect(container.querySelector('.text-blue-500')).toBeInTheDocument();
  });

  it('formats time as "Just now" for recent notifications', () => {
    const notification = createMockNotification({ createdAt: new Date() });
    render(<NotificationItem notification={notification} />);

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('formats time in minutes for older notifications', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const notification = createMockNotification({ createdAt: fiveMinutesAgo });
    render(<NotificationItem notification={notification} />);

    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });
});
