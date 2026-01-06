'use client';

import { useEffect, useState } from 'react';
import { FeatureMetadata } from '@/lib/features/parser';

interface FeatureListProps {
  onFeatureSelect?: (feature: FeatureMetadata) => void;
}

export default function FeatureList({ onFeatureSelect }: FeatureListProps) {
  const [features, setFeatures] = useState<FeatureMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/features');
      if (!response.ok) {
        throw new Error('Failed to fetch features');
      }
      const data = await response.json();
      setFeatures(data.features);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeatures = features.filter((feature) => {
    if (statusFilter === 'all') return true;
    const status = feature.status?.toLowerCase() || '';
    if (statusFilter === 'not-started') {
      return status.includes('not started') || status === 'not started';
    }
    if (statusFilter === 'in-progress') {
      return status.includes('in progress') || status.includes('in_progress');
    }
    if (statusFilter === 'completed') {
      return status.includes('completed') || status.includes('✅');
    }
    return true;
  });

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('✅')) {
      return 'bg-green-100 text-green-800';
    }
    if (s.includes('in progress') || s.includes('in_progress')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Loading features...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Features ({filteredFeatures.length})
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map((feature) => (
          <div
            key={feature.id}
            onClick={() => onFeatureSelect?.(feature)}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all bg-white dark:bg-gray-800"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              {feature.status && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                    feature.status
                  )}`}
                >
                  {feature.status.replace('✅', '').trim() || 'Not Started'}
                </span>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {feature.priority && (
                <div>
                  <span className="font-medium">Priority:</span> {feature.priority}
                </div>
              )}
              {feature.estimatedTime && (
                <div>
                  <span className="font-medium">Time:</span> {feature.estimatedTime}
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View Spec →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

