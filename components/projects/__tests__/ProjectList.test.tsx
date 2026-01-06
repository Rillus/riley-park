/**
 * Tests for ProjectList component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectList from '../ProjectList';
import { fetchProjects } from '@/lib/projects';
import { Project } from '@/lib/projects/types';

// Mock the API client
jest.mock('@/lib/projects', () => ({
  fetchProjects: jest.fn(),
}));

const mockFetchProjects = fetchProjects as jest.MockedFunction<typeof fetchProjects>;

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Project Alpha',
    repositoryUrl: 'https://github.com/user/alpha',
    defaultBranch: 'main',
    description: 'First project',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-05T12:00:00Z'),
  },
  {
    id: 'project-2',
    name: 'Project Beta',
    repositoryUrl: 'https://github.com/user/beta',
    defaultBranch: 'develop',
    description: 'Second project',
    createdAt: new Date('2025-01-02T00:00:00Z'),
    updatedAt: new Date('2025-01-06T12:00:00Z'),
  },
];

describe('ProjectList', () => {
  const mockOnView = jest.fn();
  const mockOnCreate = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchProjects.mockResolvedValue({
      projects: mockProjects,
      total: mockProjects.length,
    });
  });

  it('should render loading state initially', () => {
    render(<ProjectList onView={mockOnView} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render projects after loading', async () => {
    render(<ProjectList onView={mockOnView} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('should render "New Project" button', async () => {
    render(<ProjectList onView={mockOnView} onCreate={mockOnCreate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
  });

  it('should call onCreate when "New Project" is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectList onView={mockOnView} onCreate={mockOnCreate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /new project/i }));
    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('should filter projects when searching', async () => {
    const user = userEvent.setup();
    render(<ProjectList onView={mockOnView} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Alpha');
    
    // Should have called fetchProjects with search term
    await waitFor(() => {
      expect(mockFetchProjects).toHaveBeenCalledWith('Alpha');
    });
  });

  it('should display empty state when no projects exist', async () => {
    mockFetchProjects.mockResolvedValue({ projects: [], total: 0 });
    
    render(<ProjectList onView={mockOnView} />);
    
    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeInTheDocument();
    });
  });

  it('should display error state when fetch fails', async () => {
    mockFetchProjects.mockRejectedValue(new Error('Failed to fetch'));
    
    render(<ProjectList onView={mockOnView} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('should pass onEdit and onDelete to ProjectCard when provided', async () => {
    const user = userEvent.setup();
    render(
      <ProjectList 
        onView={mockOnView} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
    
    // Find the edit buttons
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
    
    await user.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('should have a retry button when fetch fails', async () => {
    mockFetchProjects.mockRejectedValueOnce(new Error('Failed to fetch'));
    const user = userEvent.setup();
    
    render(<ProjectList onView={mockOnView} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
    
    // Reset the mock to succeed
    mockFetchProjects.mockResolvedValue({
      projects: mockProjects,
      total: mockProjects.length,
    });
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
  });

  it('should display project count', async () => {
    render(<ProjectList onView={mockOnView} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/2 project/i)).toBeInTheDocument();
  });
});
