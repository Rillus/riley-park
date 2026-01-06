'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/projects/types';
import { fetchProject } from '@/lib/projects';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onLaunchAgent?: (project: Project) => void;
  onCreateFeature?: (project: Project) => void;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function ProjectDetail({
  projectId,
  onBack,
  onEdit,
  onDelete,
  onLaunchAgent,
  onCreateFeature,
}: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProject(projectId);
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-700 dark:text-red-400 mb-4">
          Failed to load project: {error || 'Project not found'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            aria-label="Back to projects"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {project.name}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
              {project.defaultBranch}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onLaunchAgent && (
            <button
              onClick={() => onLaunchAgent(project)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Launch Agent
            </button>
          )}
          {onCreateFeature && (
            <button
              onClick={() => onCreateFeature(project)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Create Feature
            </button>
          )}
          <button
            onClick={() => onEdit(project)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(project)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Project Information
        </h2>
        
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Repository URL
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              <a 
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {project.repositoryUrl}
              </a>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Default Branch
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {project.defaultBranch}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(new Date(project.createdAt))}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Last Updated
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(new Date(project.updatedAt))}
            </dd>
          </div>
        </dl>

        {project.description && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
        )}
      </div>

      {/* Placeholder sections for future features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Active Agents
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No agents currently running for this project.
          </p>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Features
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No features associated with this project yet.
          </p>
        </div>
      </div>
    </div>
  );
}
