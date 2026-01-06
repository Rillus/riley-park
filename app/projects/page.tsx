'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectList, ProjectForm, DeleteConfirmDialog } from '@/components/projects';
import { Project } from '@/lib/projects/types';

type View = 'list' | 'create' | 'edit';

export default function ProjectsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleView = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  const handleCreate = () => {
    setView('create');
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setView('edit');
  };

  const handleDelete = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleFormSuccess = () => {
    setView('list');
    setSelectedProject(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setView('list');
    setSelectedProject(null);
  };

  const handleDeleteConfirm = () => {
    setProjectToDelete(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteCancel = () => {
    setProjectToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {view === 'create' ? 'Create Project' : view === 'edit' ? 'Edit Project' : 'Projects'}
            </h1>
            {view === 'list' && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your projects and repositories
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {view !== 'list' && (
              <button
                onClick={handleFormCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back to List
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Content */}
        {view === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <ProjectList
              key={refreshKey}
              onView={handleView}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}

        {view === 'create' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              New Project
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Create a new project to manage a repository. You can add features and launch agents for this project.
            </p>
            <ProjectForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
          </div>
        )}

        {view === 'edit' && selectedProject && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Project
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Update the project details below.
            </p>
            <ProjectForm
              project={selectedProject}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          project={projectToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </div>
  );
}
