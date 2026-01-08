'use client';

import { useState, useEffect, useCallback } from 'react';
import { PullRequestWithRelations } from '@/lib/pull-requests/types';
import { fetchPullRequests, FetchPullRequestsOptions } from '@/lib/pull-requests/client';
import PullRequestCard from './PullRequestCard';

interface PullRequestListProps {
  featureId?: string;
  projectId?: string;
  onViewPR: (pullRequest: PullRequestWithRelations) => void;
}

export default function PullRequestList({
  featureId,
  projectId,
  onViewPR,
}: PullRequestListProps) {
  const [pullRequests, setPullRequests] = useState<PullRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadPullRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const options: FetchPullRequestsOptions = {
        featureId,
        projectId,
        sortBy: sortBy as FetchPullRequestsOptions['sortBy'],
        sortOrder,
      };

      if (statusFilter) {
        options.status = statusFilter;
      }

      const response = await fetchPullRequests(options);
      setPullRequests(response.pullRequests);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pull requests');
    } finally {
      setLoading(false);
    }
  }, [featureId, projectId, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadPullRequests();
  }, [loadPullRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading pull requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={loadPullRequests}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label
              htmlFor="statusFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Filter by Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="merged">Merged</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label
              htmlFor="sortBy"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="status">Status</option>
              <option value="prTitle">Title</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label
              htmlFor="sortOrder"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Order
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {total} pull request{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Empty state */}
      {!loading && !error && pullRequests.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No pull requests found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter 
              ? 'Try adjusting your filters'
              : 'No pull requests have been created yet'
            }
          </p>
        </div>
      )}

      {/* PR cards grid */}
      {!loading && !error && pullRequests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pullRequests.map((pr) => (
            <PullRequestCard
              key={pr.id}
              pullRequest={pr}
              onView={onViewPR}
            />
          ))}
        </div>
      )}
    </div>
  );
}

