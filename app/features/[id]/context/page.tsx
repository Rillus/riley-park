'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchFeature } from '@/lib/features/client';
import { FeatureWithWorkflow } from '@/lib/features/types';
import FeatureContextView from '@/components/context/FeatureContextView';

export default function FeatureContextPage() {
  const params = useParams();
  const router = useRouter();
  const featureId = params.id as string;

  const [feature, setFeature] = useState<FeatureWithWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeature() {
      try {
        setLoading(true);
        const data = await fetchFeature(featureId);
        setFeature(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature');
      } finally {
        setLoading(false);
      }
    }

    if (featureId) {
      loadFeature();
    }
  }, [featureId]);

  const handleCancel = () => {
    router.push(`/features/${featureId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500 dark:text-gray-400">Loading feature...</p>
        </div>
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error || 'Feature not found'}
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
          <span>Back to Feature</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Feature Context: {feature.title}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          View and manage feature context that will be included in agent prompts
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <FeatureContextView featureId={featureId} />
      </div>
    </div>
  );
}

