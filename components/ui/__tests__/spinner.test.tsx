import { render, screen } from '@testing-library/react';
import { Spinner } from '../spinner';

describe('Spinner', () => {
  it('renders spinner with loading text', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with small size', () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.firstChild).toHaveClass('h-4', 'w-4');
  });

  it('renders with medium size by default', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('h-8', 'w-8');
  });

  it('renders with large size', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.firstChild).toHaveClass('h-12', 'w-12');
  });
});

