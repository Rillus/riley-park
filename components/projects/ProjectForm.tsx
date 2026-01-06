'use client';

import { useState, useEffect } from 'react';
import { Project, CreateProjectInput, createProjectSchema } from '@/lib/projects/types';
import { createProject, updateProject } from '@/lib/projects';

interface ProjectFormProps {
  project?: Project;
  onSuccess: (project: Project) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  description?: string;
  general?: string;
}

export default function ProjectForm({
  project,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const isEditing = !!project;

  const [name, setName] = useState(project?.name || '');
  const [repositoryUrl, setRepositoryUrl] = useState(project?.repositoryUrl || '');
  const [defaultBranch, setDefaultBranch] = useState(project?.defaultBranch || 'main');
  const [description, setDescription] = useState(project?.description || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Update form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setRepositoryUrl(project.repositoryUrl);
      setDefaultBranch(project.defaultBranch);
      setDescription(project.description || '');
    }
  }, [project]);

  const validateForm = (): boolean => {
    const input: CreateProjectInput = {
      name,
      repositoryUrl,
      defaultBranch: defaultBranch || 'main',
      description: description || undefined,
    };

    const result = createProjectSchema.safeParse(input);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const input = {
        name,
        repositoryUrl,
        defaultBranch: defaultBranch || 'main',
        description: description || undefined,
      };

      let result: Project;

      if (isEditing) {
        result = await updateProject(project.id, input);
      } else {
        result = await createProject(input);
      }

      onSuccess(result);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Project Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="My Project"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Repository URL */}
      <div>
        <label
          htmlFor="repositoryUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Repository URL *
        </label>
        <input
          id="repositoryUrl"
          type="text"
          value={repositoryUrl}
          onChange={(e) => setRepositoryUrl(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.repositoryUrl
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="https://github.com/user/repo"
        />
        {errors.repositoryUrl && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.repositoryUrl}
          </p>
        )}
      </div>

      {/* Default Branch */}
      <div>
        <label
          htmlFor="defaultBranch"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Default Branch
        </label>
        <input
          id="defaultBranch"
          type="text"
          value={defaultBranch}
          onChange={(e) => setDefaultBranch(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.defaultBranch
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="main"
        />
        {errors.defaultBranch && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.defaultBranch}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="A brief description of the project..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.description}
          </p>
        )}
      </div>

      {/* General error */}
      {errors.general && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
