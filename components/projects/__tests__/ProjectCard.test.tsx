/**
 * Tests for ProjectCard component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectCard from '../ProjectCard';
import { Project } from '@/lib/projects/types';

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  repositoryUrl: 'https://github.com/user/repo',
  defaultBranch: 'main',
  description: 'A test project description',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-05T12:00:00Z'),
};

describe('ProjectCard', () => {
  const mockOnView = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render project name', () => {
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should render repository URL', () => {
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    expect(screen.getByText('https://github.com/user/repo')).toBeInTheDocument();
  });

  it('should render default branch', () => {
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    expect(screen.getByText('A test project description')).toBeInTheDocument();
  });

  it('should not render description section when not provided', () => {
    const projectWithoutDescription = { ...mockProject, description: null };
    render(<ProjectCard project={projectWithoutDescription} onView={mockOnView} />);
    expect(screen.queryByText('A test project description')).not.toBeInTheDocument();
  });

  it('should call onView when view button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    
    const viewButton = screen.getByRole('button', { name: /view/i });
    await user.click(viewButton);
    
    expect(mockOnView).toHaveBeenCalledWith(mockProject);
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectCard 
        project={mockProject} 
        onView={mockOnView} 
        onEdit={mockOnEdit}
      />
    );
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectCard 
        project={mockProject} 
        onView={mockOnView} 
        onDelete={mockOnDelete}
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockProject);
  });

  it('should not render edit button when onEdit is not provided', () => {
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', () => {
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should display last updated time', () => {
    render(<ProjectCard project={mockProject} onView={mockOnView} />);
    // The component should show some indication of when it was last updated
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });
});
