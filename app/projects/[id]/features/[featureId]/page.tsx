'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FeatureDetail,
  FeatureForm,
  DeleteFeatureDialog,
} from '@/components/features';
import { FeatureWithWorkflow, WorkflowStep } from '@/lib/features/types';

interface FeatureDetailPageProps {
  params: Promise<{ id: string; featureId: string }>;
}

type View = 'detail' | 'edit';

export default function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const { id: projectId, featureId } = use(params);
  const router = useRouter();
  
  const [view, setView] = useState<View>('detail');
  const [featureToEdit, setFeatureToEdit] = useState<FeatureWithWorkflow | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<FeatureWithWorkflow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBack = () => {
    router.push(`/projects/${projectId}/features`);
  };

  const handleEdit = (feature: FeatureWithWorkflow) => {
    setFeatureToEdit(feature);
    setView('edit');
  };

  const handleDelete = (feature: FeatureWithWorkflow) => {
    setFeatureToDelete(feature);
  };

  const handleLaunchAgent = (step: WorkflowStep) => {
    // Navigate to launch agent with step info
    // This is a placeholder - will be implemented with agent integration
    console.log('Launch agent for step:', step);
    alert(`Launch agent for ${step.stepType} - Coming soon!`);
  };

  const handleFormSuccess = () => {
    setView('detail');
    setFeatureToEdit(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setView('detail');
    setFeatureToEdit(null);
  };

  const handleDeleteConfirm = () => {
    setFeatureToDelete(null);
    router.push(`/projects/${projectId}/features`);
  };

  const handleDeleteCancel = () => {
    setFeatureToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link
                href={`/projects/${projectId}/features`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Features
              </Link>
            </p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {view === 'edit' ? 'Edit Feature' : 'Feature Details'}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/projects/${projectId}/features`}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              All Features
            </Link>
          </div>
        </div>

        {/* Content */}
        {view === 'detail' && (
          <FeatureDetail
            key={refreshKey}
            featureId={featureId}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLaunchAgent={handleLaunchAgent}
          />
        )}

        {view === 'edit' && featureToEdit && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Feature
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Update the feature details below.
            </p>
            <FeatureForm
              feature={featureToEdit}
              projects={[
                {
                  id: projectId,
                  name: 'Current Project',
                },
              ]}
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
