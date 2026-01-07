/**
 * Tests for AppHeader component
 */

import { render, screen } from '@testing-library/react';
import AppHeader from '../AppHeader';

// Mock NotificationCenter
jest.mock('@/components/notifications', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

describe('AppHeader', () => {
  it('should render the logo', () => {
    render(<AppHeader />);

    expect(screen.getByText('Riley Park')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<AppHeader />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /features/i })).toHaveAttribute('href', '/features');
  });

  it('should render notification center', () => {
    render(<AppHeader />);

    expect(screen.getByTestId('notification-center')).toBeInTheDocument();
  });

  it('should link logo to home page', () => {
    render(<AppHeader />);

    const logoLink = screen.getByRole('link', { name: /riley park/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
