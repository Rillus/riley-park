import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  it('renders card with content', () => {
    render(
      <Card>
        <CardContent>Test content</CardContent>
      </Card>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders card with header and title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders card with description', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Test description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders card with footer', () => {
    render(
      <Card>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});

