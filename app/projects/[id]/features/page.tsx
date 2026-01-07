'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FeatureList,
  FeatureForm,
  DeleteFeatureDialog,
} from '@/components/features';
import { FeatureWithWorkflow } from '@/lib/features/types';
import { fetchProject } from '@/lib/projects';
import { Project } from '@/lib/projects/types';

interface ProjectFeaturesPageProps {
  params: Promise<{ id: string }>;
}

type View = 'list' | 'create' | 'edit';

export default function ProjectFeaturesPage({ params }: ProjectFeaturesPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  
  const [view, setView] = useState<View>('list');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureToEdit, setFeatureToEdit] = useState<FeatureWithWorkflow | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<FeatureWithWorkflow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const proj = await fetchProject(projectId);
        setProject(proj);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const handleViewFeature = (feature: FeatureWithWorkflow) => {
    router.push(`/projects/${projectId}/features/${feature.id}`);
  };

  const handleEditFeature = (feature: FeatureWithWorkflow) => {
    setFeatureToEdit(feature);
    setView('edit');
  };

  const handleDeleteFeature = (feature: FeatureWithWorkflow) => {
    setFeatureToDelete(feature);
  };

  const handleCreateFeature = () => {
    setView('create');
  };

  const handleFormSuccess = () => {
    setView('list');
    setFeatureToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setView('list');
    setFeatureToEdit(null);
  };

  const handleDeleteConfirm = () => {
    setFeatureToDelete(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteCancel = () => {
    setFeatureToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link
            href="/projects"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link
                href={`/projects/${projectId}`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {project?.name}
              </Link>
            </p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {view === 'create'
                ? 'Create Feature'
                : view === 'edit'
                ? 'Edit Feature'
                : 'Features'}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Back to Project
            </Link>
          </div>
        </div>

        {/* Content */}
        {view === 'list' && (
          <FeatureList
            key={refreshKey}
            projectId={projectId}
            onViewFeature={handleViewFeature}
            onEditFeature={handleEditFeature}
            onDeleteFeature={handleDeleteFeature}
            onCreateFeature={handleCreateFeature}
          />
        )}

        {view === 'create' && project && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create New Feature
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Define a new feature for this project. Workflow steps will be
              automatically created.
            </p>
            <FeatureForm
              projects={[{ id: project.id, name: project.name }]}
              projectId={project.id}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {view === 'edit' && featureToEdit && project && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Feature
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Update the feature details below.
            </p>
            <FeatureForm
              feature={featureToEdit}
              projects={[{ id: project.id, name: project.name }]}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteFeatureDialog
          feature={featureToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </div>
  );
}
