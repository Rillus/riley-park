/**
 * Tests for ProjectDetail component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectDetail from '../ProjectDetail';
import { fetchProject } from '@/lib/projects';
import { Project } from '@/lib/projects/types';

// Mock the API client
jest.mock('@/lib/projects', () => ({
  fetchProject: jest.fn(),
}));

const mockFetchProject = fetchProject as jest.MockedFunction<typeof fetchProject>;

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  repositoryUrl: 'https://github.com/user/repo',
  defaultBranch: 'main',
  description: 'A test project description that is quite detailed',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-05T12:00:00Z'),
};

describe('ProjectDetail', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnLaunchAgent = jest.fn();
  const mockOnCreateFeature = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchProject.mockResolvedValue(mockProject);
  });

  it('should render loading state initially', () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render project details after loading', async () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('should display repository URL', async () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('https://github.com/user/repo')).toBeInTheDocument();
    });
  });

  it('should display default branch', async () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      // Default branch appears multiple times - in the badge and details
      const branchElements = screen.getAllByText('main');
      expect(branchElements.length).toBeGreaterThan(0);
    });
  });

  it('should display description', async () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/A test project description/)).toBeInTheDocument();
    });
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockOnDelete).toHaveBeenCalledWith(mockProject);
  });

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should display error when fetch fails', async () => {
    mockFetchProject.mockRejectedValue(new Error('Project not found'));

    render(
      <ProjectDetail 
        projectId="nonexistent" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('should render Launch Agent button when provided', async () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onLaunchAgent={mockOnLaunchAgent}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /launch agent/i })).toBeInTheDocument();
  });

  it('should call onLaunchAgent when Launch Agent button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onLaunchAgent={mockOnLaunchAgent}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /launch agent/i }));
    expect(mockOnLaunchAgent).toHaveBeenCalledWith(mockProject);
  });

  it('should render Create Feature button when provided', async () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateFeature={mockOnCreateFeature}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /create feature/i })).toBeInTheDocument();
  });

  it('should display created and updated timestamps', async () => {
    render(
      <ProjectDetail 
        projectId="project-1" 
        onBack={mockOnBack}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });
});
