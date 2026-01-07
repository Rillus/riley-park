/**
 * Tests for FeatureForm component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureForm from '../FeatureForm';
import { FeatureWithWorkflow } from '@/lib/features/types';
import { createFeature, updateFeature } from '@/lib/features';

// Mock the API client
jest.mock('@/lib/features', () => ({
  createFeature: jest.fn(),
  updateFeature: jest.fn(),
}));

const mockCreateFeature = createFeature as jest.MockedFunction<typeof createFeature>;
const mockUpdateFeature = updateFeature as jest.MockedFunction<typeof updateFeature>;

const mockProjects = [
  { id: 'project-1', name: 'Project One' },
  { id: 'project-2', name: 'Project Two' },
];

const mockFeature: FeatureWithWorkflow = {
  id: 'feature-1',
  projectId: 'project-1',
  title: 'Test Feature',
  description: 'A test feature description',
  priority: 'high',
  status: 'planned',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-05T12:00:00Z'),
  workflowSteps: [],
};

describe('FeatureForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should render create form with empty fields', () => {
      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/priority/i)).toHaveValue('medium');
    });

    it('should render project selection dropdown', () => {
      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const projectSelect = screen.getByLabelText(/project/i);
      expect(projectSelect).toBeInTheDocument();
      expect(screen.getByText('Project One')).toBeInTheDocument();
      expect(screen.getByText('Project Two')).toBeInTheDocument();
    });

    it('should pre-select project when projectId is provided', () => {
      render(
        <FeatureForm
          projects={mockProjects}
          projectId="project-2"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/project/i)).toHaveValue('project-2');
    });

    it('should show "Create Feature" button in create mode', () => {
      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByRole('button', { name: /create feature/i })).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: /create feature/i }));

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
      expect(mockCreateFeature).not.toHaveBeenCalled();
    });

    it('should validate project selection', async () => {
      const user = userEvent.setup();
      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.type(screen.getByLabelText(/title/i), 'New Feature');
      await user.type(screen.getByLabelText(/description/i), 'Feature description');
      await user.click(screen.getByRole('button', { name: /create feature/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select a project/i)).toBeInTheDocument();
      });
      expect(mockCreateFeature).not.toHaveBeenCalled();
    });

    it('should create feature on valid submission', async () => {
      const user = userEvent.setup();
      const createdFeature = { ...mockFeature, id: 'new-feature' };
      mockCreateFeature.mockResolvedValue(createdFeature);

      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.selectOptions(screen.getByLabelText(/project/i), 'project-1');
      await user.type(screen.getByLabelText(/title/i), 'New Feature');
      await user.type(screen.getByLabelText(/description/i), 'A new feature description');
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high');

      await user.click(screen.getByRole('button', { name: /create feature/i }));

      await waitFor(() => {
        expect(mockCreateFeature).toHaveBeenCalledWith({
          projectId: 'project-1',
          title: 'New Feature',
          description: 'A new feature description',
          priority: 'high',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(createdFeature);
    });

    it('should display API error on creation failure', async () => {
      const user = userEvent.setup();
      mockCreateFeature.mockRejectedValue(new Error('Failed to create feature'));

      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.selectOptions(screen.getByLabelText(/project/i), 'project-1');
      await user.type(screen.getByLabelText(/title/i), 'New Feature');
      await user.type(screen.getByLabelText(/description/i), 'Feature description');

      await user.click(screen.getByRole('button', { name: /create feature/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create feature/i)).toBeInTheDocument();
      });
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    it('should render edit form with feature data', () => {
      render(
        <FeatureForm
          feature={mockFeature}
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/title/i)).toHaveValue('Test Feature');
      expect(screen.getByLabelText(/description/i)).toHaveValue('A test feature description');
      expect(screen.getByLabelText(/priority/i)).toHaveValue('high');
    });

    it('should disable project selection in edit mode', () => {
      render(
        <FeatureForm
          feature={mockFeature}
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/project/i)).toBeDisabled();
    });

    it('should show "Update Feature" button in edit mode', () => {
      render(
        <FeatureForm
          feature={mockFeature}
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByRole('button', { name: /update feature/i })).toBeInTheDocument();
    });

    it('should update feature on valid submission', async () => {
      const user = userEvent.setup();
      const updatedFeature = { ...mockFeature, title: 'Updated Feature' };
      mockUpdateFeature.mockResolvedValue(updatedFeature);

      render(
        <FeatureForm
          feature={mockFeature}
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.clear(screen.getByLabelText(/title/i));
      await user.type(screen.getByLabelText(/title/i), 'Updated Feature');

      await user.click(screen.getByRole('button', { name: /update feature/i }));

      await waitFor(() => {
        expect(mockUpdateFeature).toHaveBeenCalledWith(mockFeature.id, {
          title: 'Updated Feature',
          description: 'A test feature description',
          priority: 'high',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(updatedFeature);
    });
  });

  describe('Common behaviour', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      mockCreateFeature.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockFeature), 100))
      );

      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.selectOptions(screen.getByLabelText(/project/i), 'project-1');
      await user.type(screen.getByLabelText(/title/i), 'New Feature');
      await user.type(screen.getByLabelText(/description/i), 'Feature description');

      const submitButton = screen.getByRole('button', { name: /create feature/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('should show loading state on submit button', async () => {
      const user = userEvent.setup();
      mockCreateFeature.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockFeature), 100))
      );

      render(
        <FeatureForm
          projects={mockProjects}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      await user.selectOptions(screen.getByLabelText(/project/i), 'project-1');
      await user.type(screen.getByLabelText(/title/i), 'New Feature');
      await user.type(screen.getByLabelText(/description/i), 'Feature description');

      await user.click(screen.getByRole('button', { name: /create feature/i }));

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });
});
