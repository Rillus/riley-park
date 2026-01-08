import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '../breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders breadcrumbs with items', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          { label: 'Project Name' },
        ]}
      />
    );
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Project Name')).toBeInTheDocument();
  });

  it('renders home icon', () => {
    render(<Breadcrumbs items={[]} />);
    const homeLink = screen.getByLabelText('Home');
    expect(homeLink).toBeInTheDocument();
  });

  it('renders last item without link', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          { label: 'Current Page' },
        ]}
      />
    );
    const currentPage = screen.getByText('Current Page');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });

  it('has proper ARIA label', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });
});

