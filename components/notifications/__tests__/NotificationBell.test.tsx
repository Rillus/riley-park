/**
 * Tests for NotificationBell component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import NotificationBell from '../NotificationBell';

describe('NotificationBell', () => {
  it('should render bell icon', () => {
    render(<NotificationBell unreadCount={0} onClick={jest.fn()} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it('should not show badge when unreadCount is 0', () => {
    render(<NotificationBell unreadCount={0} onClick={jest.fn()} />);

    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('should show badge with unread count', () => {
    render(<NotificationBell unreadCount={5} onClick={jest.fn()} />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  it('should show 99+ when unread count exceeds 99', () => {
    render(<NotificationBell unreadCount={150} onClick={jest.fn()} />);

    const badge = screen.getByTestId('notification-badge');
    expect(badge).toHaveTextContent('99+');
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<NotificationBell unreadCount={0} onClick={onClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it('should apply active styling when isActive is true', () => {
    render(<NotificationBell unreadCount={0} onClick={jest.fn()} isActive={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-active', 'true');
  });

  it('should not apply active styling when isActive is false', () => {
    render(<NotificationBell unreadCount={0} onClick={jest.fn()} isActive={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-active', 'false');
  });
});
