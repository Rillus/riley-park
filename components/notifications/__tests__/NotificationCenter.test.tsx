/**
 * Tests for NotificationCenter component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import NotificationCenter from '../NotificationCenter';

// Mock useNotifications hook
jest.mock('@/lib/notifications/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

import { useNotifications } from '@/lib/notifications/useNotifications';

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('NotificationCenter', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'agent_finished' as const,
      title: 'Agent Completed',
      message: 'Agent has finished',
      read: false,
      actionUrl: '/agents/1',
      metadata: null,
      createdAt: new Date('2026-01-06T12:00:00Z'),
      userId: null,
    },
  ];

  const defaultHookReturn = {
    notifications: mockNotifications,
    unreadCount: 1,
    loading: false,
    error: null,
    refresh: jest.fn(),
    markAsRead: jest.fn(),
    dismiss: jest.fn(),
    clearAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue(defaultHookReturn);
  });

  it('should render notification bell with unread count', () => {
    render(<NotificationCenter />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toHaveTextContent('1');
  });

  it('should open dropdown when bell is clicked', () => {
    render(<NotificationCenter />);

    // Dropdown should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click bell
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    // Dropdown should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Agent Completed')).toBeInTheDocument();
  });

  it('should close dropdown when clicking bell again', () => {
    render(<NotificationCenter />);

    const bell = screen.getByRole('button', { name: /notifications/i });
    
    // Open
    fireEvent.click(bell);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close
    fireEvent.click(bell);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close dropdown when clicking close button', () => {
    render(<NotificationCenter />);

    // Open dropdown
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    // Click close
    const closeButton = screen.getByLabelText(/close notifications/i);
    fireEvent.click(closeButton);

    // Dropdown should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <div>
        <NotificationCenter />
        <button>Outside</button>
      </div>
    );

    // Open dropdown
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    // Dropdown should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call markAsRead when marking notification as read', () => {
    render(<NotificationCenter />);

    // Open dropdown
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    // Click mark as read
    const markAsReadButton = screen.getByLabelText(/mark as read/i);
    fireEvent.click(markAsReadButton);

    expect(defaultHookReturn.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('should call dismiss when dismissing notification', () => {
    render(<NotificationCenter />);

    // Open dropdown
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    // Click dismiss
    const dismissButton = screen.getByLabelText(/dismiss/i);
    fireEvent.click(dismissButton);

    expect(defaultHookReturn.dismiss).toHaveBeenCalledWith('notif-1');
  });

  it('should call clearAll when clicking clear all', () => {
    render(<NotificationCenter />);

    // Open dropdown
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    // Click clear all
    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllButton);

    expect(defaultHookReturn.clearAll).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultHookReturn,
      notifications: [],
      loading: true,
    });

    render(<NotificationCenter />);

    // Open dropdown
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show empty state when no notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...defaultHookReturn,
      notifications: [],
      unreadCount: 0,
    });

    render(<NotificationCenter />);

    // Open dropdown
    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });
});
