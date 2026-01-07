'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectDetail, ProjectForm, DeleteConfirmDialog } from '@/components/projects';
import { LaunchAgentModal } from '@/components/agent';
import { Project } from '@/lib/projects/types';
import { LaunchAgentResponse } from '@/lib/cursor-api';

type View = 'detail' | 'edit';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [view, setView] = useState<View>('detail');
  const [project, setProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectForAgent, setProjectForAgent] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBack = () => {
    router.push('/projects');
  };

  const handleEdit = (proj: Project) => {
    setProject(proj);
    setView('edit');
  };

  const handleDelete = (proj: Project) => {
    setProjectToDelete(proj);
  };

  const handleLaunchAgent = (proj: Project) => {
    setProjectForAgent(proj);
  };

  const handleAgentLaunched = (agent: LaunchAgentResponse) => {
    setProjectForAgent(null);
    // Navigate to the agent conversation view
    router.push(`/agents/${agent.id}/conversation`);
  };

  const handleCreateFeature = (proj: Project) => {
    // Navigate to features page for this project
    router.push(`/projects/${proj.id}/features`);
  };

  const handleFormSuccess = () => {
    setView('detail');
    setProject(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setView('detail');
    setProject(null);
  };

  const handleDeleteConfirm = () => {
    setProjectToDelete(null);
    router.push('/projects');
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
              {view === 'edit' ? 'Edit Project' : 'Project Details'}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/projects"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              All Projects
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Content */}
        {view === 'detail' && (
          <ProjectDetail
            key={refreshKey}
            projectId={id}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLaunchAgent={handleLaunchAgent}
            onCreateFeature={handleCreateFeature}
          />
        )}

        {view === 'edit' && project && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Project
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Update the project details below.
            </p>
            <ProjectForm
              project={project}
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

        {/* Launch Agent Modal */}
        {projectForAgent && (
          <LaunchAgentModal
            isOpen={true}
            onClose={() => setProjectForAgent(null)}
            onAgentLaunched={handleAgentLaunched}
            project={{
              id: projectForAgent.id,
              name: projectForAgent.name,
              repositoryUrl: projectForAgent.repositoryUrl,
              defaultBranch: projectForAgent.defaultBranch,
            }}
          />
        )}
      </div>
    </div>
  );
}
