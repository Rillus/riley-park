'use client';

import { useState, useEffect } from 'react';
import {
  FeatureWithWorkflow,
  CreateFeatureInput,
  createFeatureSchema,
  Priority,
} from '@/lib/features/types';
import { createFeature, updateFeature } from '@/lib/features';

interface Project {
  id: string;
  name: string;
}

interface FeatureFormProps {
  feature?: FeatureWithWorkflow;
  projects: Project[];
  projectId?: string;
  onSuccess: (feature: FeatureWithWorkflow) => void;
  onCancel: () => void;
}

interface FormErrors {
  projectId?: string;
  title?: string;
  description?: string;
  priority?: string;
  general?: string;
}

export default function FeatureForm({
  feature,
  projects,
  projectId: initialProjectId,
  onSuccess,
  onCancel,
}: FeatureFormProps) {
  const isEditing = !!feature;

  const [projectId, setProjectId] = useState(feature?.projectId || initialProjectId || '');
  const [title, setTitle] = useState(feature?.title || '');
  const [description, setDescription] = useState(feature?.description || '');
  const [priority, setPriority] = useState<string>(feature?.priority || 'medium');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Update form when feature changes
  useEffect(() => {
    if (feature) {
      setProjectId(feature.projectId);
      setTitle(feature.title);
      setDescription(feature.description);
      setPriority(feature.priority);
    }
  }, [feature]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!projectId) {
      newErrors.projectId = 'Please select a project';
    }

    const input: CreateFeatureInput = {
      projectId: projectId || 'temp',
      title,
      description,
      priority: priority as typeof Priority[keyof typeof Priority],
    };

    const result = createFeatureSchema.safeParse(input);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors;
        if (field !== 'projectId') {
          newErrors[field] = issue.message;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let result: FeatureWithWorkflow;

      if (isEditing) {
        result = await updateFeature(feature.id, {
          title,
          description,
          priority: priority as typeof Priority[keyof typeof Priority],
        });
      } else {
        result = await createFeature({
          projectId,
          title,
          description,
          priority: priority as typeof Priority[keyof typeof Priority],
        });
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
      {/* Project Selection */}
      <div>
        <label
          htmlFor="projectId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Project *
        </label>
        <select
          id="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={isEditing}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            errors.projectId
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {errors.projectId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectId}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Feature title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Describe the feature requirements..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Priority */}
      <div>
        <label
          htmlFor="priority"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
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
          {loading ? 'Saving...' : isEditing ? 'Update Feature' : 'Create Feature'}
        </button>
      </div>
    </form>
  );
}
