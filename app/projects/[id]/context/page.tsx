'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchProject } from '@/lib/projects';
import { Project } from '@/lib/projects/types';
import ProjectContextEditor from '@/components/context/ProjectContextEditor';

export default function ProjectContextPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const data = await fetchProject(projectId);
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleSave = () => {
    // Optionally show success message or navigate back
    router.push(`/projects/${projectId}`);
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error || 'Project not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <span>←</span>
          <span>Back to Project</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Project Context: {project.name}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Manage project-level context that will be included in agent prompts
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <ProjectContextEditor
          projectId={projectId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

