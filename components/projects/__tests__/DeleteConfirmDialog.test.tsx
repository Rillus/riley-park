/**
 * Tests for DeleteConfirmDialog component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import { deleteProject } from '@/lib/projects';
import { Project } from '@/lib/projects/types';

// Mock the API client
jest.mock('@/lib/projects', () => ({
  deleteProject: jest.fn(),
}));

const mockDeleteProject = deleteProject as jest.MockedFunction<typeof deleteProject>;

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  repositoryUrl: 'https://github.com/user/repo',
  defaultBranch: 'main',
  description: 'A test project description',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-05T12:00:00Z'),
};

describe('DeleteConfirmDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when project is null', () => {
    render(
      <DeleteConfirmDialog 
        project={null} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when project is provided', () => {
    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display project name in the dialog', () => {
    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Test Project/)).toBeInTheDocument();
  });

  it('should display warning message', () => {
    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should delete project and call onConfirm when delete button is clicked', async () => {
    const user = userEvent.setup();
    mockDeleteProject.mockResolvedValue(undefined);

    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith(mockProject.id);
    });

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should display error when delete fails', async () => {
    const user = userEvent.setup();
    mockDeleteProject.mockRejectedValue(new Error('Delete failed'));

    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/delete failed/i)).toBeInTheDocument();
    });

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should disable buttons while deleting', async () => {
    const user = userEvent.setup();
    mockDeleteProject.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(deleteButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('should show loading text on delete button while deleting', async () => {
    const user = userEvent.setup();
    mockDeleteProject.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <DeleteConfirmDialog 
        project={mockProject} 
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByText(/deleting/i)).toBeInTheDocument();
  });
});
