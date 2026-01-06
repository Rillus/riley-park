/**
 * Tests for ProjectForm component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectForm from '../ProjectForm';
import { Project } from '@/lib/projects/types';
import { createProject, updateProject } from '@/lib/projects';

// Mock the API client
jest.mock('@/lib/projects', () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
}));

const mockCreateProject = createProject as jest.MockedFunction<typeof createProject>;
const mockUpdateProject = updateProject as jest.MockedFunction<typeof updateProject>;

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  repositoryUrl: 'https://github.com/user/repo',
  defaultBranch: 'main',
  description: 'A test project description',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-05T12:00:00Z'),
};

describe('ProjectForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should render create form with empty fields', () => {
      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/project name/i)).toHaveValue('');
      expect(screen.getByLabelText(/repository url/i)).toHaveValue('');
      expect(screen.getByLabelText(/default branch/i)).toHaveValue('main');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });

    it('should show "Create Project" button in create mode', () => {
      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      });
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it('should validate repository URL format', async () => {
      const user = userEvent.setup();
      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/project name/i), 'Test Project');
      await user.type(screen.getByLabelText(/repository url/i), 'invalid-url');
      await user.click(screen.getByRole('button', { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid repository url/i)).toBeInTheDocument();
      });
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it('should create project on valid submission', async () => {
      const user = userEvent.setup();
      const createdProject = { ...mockProject, id: 'new-project' };
      mockCreateProject.mockResolvedValue(createdProject);

      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/project name/i), 'New Project');
      await user.type(screen.getByLabelText(/repository url/i), 'https://github.com/user/new-repo');
      await user.clear(screen.getByLabelText(/default branch/i));
      await user.type(screen.getByLabelText(/default branch/i), 'develop');
      await user.type(screen.getByLabelText(/description/i), 'A new project');

      await user.click(screen.getByRole('button', { name: /create project/i }));

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: 'New Project',
          repositoryUrl: 'https://github.com/user/new-repo',
          defaultBranch: 'develop',
          description: 'A new project',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(createdProject);
    });

    it('should display API error on creation failure', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockRejectedValue(new Error('Repository already exists'));

      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/project name/i), 'New Project');
      await user.type(screen.getByLabelText(/repository url/i), 'https://github.com/user/existing-repo');

      await user.click(screen.getByRole('button', { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByText(/repository already exists/i)).toBeInTheDocument();
      });
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    it('should render edit form with project data', () => {
      render(
        <ProjectForm 
          project={mockProject} 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByLabelText(/project name/i)).toHaveValue('Test Project');
      expect(screen.getByLabelText(/repository url/i)).toHaveValue('https://github.com/user/repo');
      expect(screen.getByLabelText(/default branch/i)).toHaveValue('main');
      expect(screen.getByLabelText(/description/i)).toHaveValue('A test project description');
    });

    it('should show "Update Project" button in edit mode', () => {
      render(
        <ProjectForm 
          project={mockProject} 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      );
      expect(screen.getByRole('button', { name: /update project/i })).toBeInTheDocument();
    });

    it('should update project on valid submission', async () => {
      const user = userEvent.setup();
      const updatedProject = { ...mockProject, name: 'Updated Project' };
      mockUpdateProject.mockResolvedValue(updatedProject);

      render(
        <ProjectForm 
          project={mockProject} 
          onSuccess={mockOnSuccess} 
          onCancel={mockOnCancel} 
        />
      );

      await user.clear(screen.getByLabelText(/project name/i));
      await user.type(screen.getByLabelText(/project name/i), 'Updated Project');

      await user.click(screen.getByRole('button', { name: /update project/i }));

      await waitFor(() => {
        expect(mockUpdateProject).toHaveBeenCalledWith(mockProject.id, {
          name: 'Updated Project',
          repositoryUrl: 'https://github.com/user/repo',
          defaultBranch: 'main',
          description: 'A test project description',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(updatedProject);
    });
  });

  describe('Common behaviour', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockProject), 100))
      );

      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/project name/i), 'New Project');
      await user.type(screen.getByLabelText(/repository url/i), 'https://github.com/user/new-repo');

      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('should show loading state on submit button', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockProject), 100))
      );

      render(<ProjectForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/project name/i), 'New Project');
      await user.type(screen.getByLabelText(/repository url/i), 'https://github.com/user/new-repo');

      await user.click(screen.getByRole('button', { name: /create project/i }));

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });
});
