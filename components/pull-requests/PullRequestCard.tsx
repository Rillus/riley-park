'use client';

import { PullRequestWithRelations } from '@/lib/pull-requests/types';
import { PRStatus } from '@/lib/pull-requests/types';

interface PullRequestCardProps {
  pullRequest: PullRequestWithRelations;
  onView: (pullRequest: PullRequestWithRelations) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
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

export default function PullRequestCard({
  pullRequest,
  onView,
}: PullRequestCardProps) {
  const createdAt = new Date(pullRequest.createdAt);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
            {pullRequest.prTitle}
          </h3>
          {pullRequest.prNumber && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              #{pullRequest.prNumber}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2 ${getStatusBadgeColor(pullRequest.status)}`}>
          {pullRequest.status}
        </span>
      </div>
      
      <div className="mb-3 space-y-1">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium mr-2">Feature:</span>
          <span className="truncate">{pullRequest.feature.title}</span>
        </div>
        {pullRequest.workflowStep && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium mr-2">Step:</span>
            <span>{pullRequest.workflowStep.stepType}</span>
          </div>
        )}
        {pullRequest.branchName && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium mr-2">Branch:</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {pullRequest.branchName}
            </code>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Created {formatRelativeTime(createdAt)}
        </span>
        
        <div className="flex gap-2">
          <a
            href={pullRequest.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Open on GitHub
          </a>
          <button
            onClick={() => onView(pullRequest)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

