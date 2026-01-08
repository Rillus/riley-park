'use client';

import { useState, useEffect } from 'react';
import { PullRequestWithProject } from '@/lib/pull-requests/types';
import { fetchPullRequest, updatePullRequest } from '@/lib/pull-requests/client';
import { PRStatus } from '@/lib/pull-requests/types';
import Link from 'next/link';

interface PullRequestDetailProps {
  prId: string;
  onBack?: () => void;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case PRStatus.DRAFT:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case PRStatus.OPEN:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case PRStatus.MERGED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case PRStatus.CLOSED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

export default function PullRequestDetail({
  prId,
  onBack,
}: PullRequestDetailProps) {
  const [pullRequest, setPullRequest] = useState<PullRequestWithProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPullRequest();
  }, [prId]);

  const loadPullRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const pr = await fetchPullRequest(prId);
      setPullRequest(pr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pull request');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: PRStatus) => {
    if (!pullRequest) return;

    try {
      setUpdating(true);
      await updatePullRequest(prId, { status: newStatus });
      await loadPullRequest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading pull request...</div>
      </div>
    );
  }

  if (error || !pullRequest) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error || 'Pull request not found'}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Go back
          </button>
        )}
      </div>
    );
  }

  const createdAt = new Date(pullRequest.createdAt);
  const updatedAt = new Date(pullRequest.updatedAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ← Back
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pullRequest.prTitle}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(pullRequest.status)}`}>
              {pullRequest.status}
            </span>
          </div>
          {pullRequest.prNumber && (
            <p className="text-gray-600 dark:text-gray-400">
              PR #{pullRequest.prNumber}
            </p>
          )}
        </div>
        <a
          href={pullRequest.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Open on GitHub
        </a>
      </div>

      {/* PR Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Pull Request Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PR URL
            </label>
            <a
              href={pullRequest.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {pullRequest.prUrl}
            </a>
          </div>

          {pullRequest.branchName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch
              </label>
              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {pullRequest.branchName}
              </code>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Feature
            </label>
            <Link
              href={`/features/${pullRequest.feature.id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {pullRequest.feature.title}
            </Link>
          </div>

          {pullRequest.workflowStep && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Workflow Step
              </label>
              <span className="text-gray-900 dark:text-gray-100">
                {pullRequest.workflowStep.stepType} (Order: {pullRequest.workflowStep.stepOrder})
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <Link
              href={`/projects/${pullRequest.feature.project.id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {pullRequest.feature.project.name}
            </Link>
          </div>

          {pullRequest.agentId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agent ID
              </label>
              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {pullRequest.agentId}
              </code>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Created
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(createdAt)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Updated
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleStatusUpdate(PRStatus.OPEN)}
            disabled={updating || pullRequest.status === PRStatus.OPEN}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Open
          </button>

          <button
            onClick={() => handleStatusUpdate(PRStatus.MERGED)}
            disabled={updating || pullRequest.status === PRStatus.MERGED}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Merged
          </button>

          <button
            onClick={() => handleStatusUpdate(PRStatus.CLOSED)}
            disabled={updating || pullRequest.status === PRStatus.CLOSED}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Closed
          </button>

          <button
            onClick={loadPullRequest}
            disabled={updating}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

