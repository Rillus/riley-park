'use client';

import { WorkflowStep, WorkflowStepStatus } from '@/lib/features/types';
import { getWorkflowStepLabel, WorkflowStepType } from '@/lib/agent-launch';
import { PullRequestWithRelations } from '@/lib/pull-requests/types';

interface WorkflowStepCardProps {
  step: WorkflowStep;
  pullRequests?: PullRequestWithRelations[];
  onLaunchAgent?: (step: WorkflowStep) => void;
  onViewAgent?: (agentId: string) => void;
  onMarkComplete?: (step: WorkflowStep) => void;
}

const statusConfig: Record<WorkflowStepStatus, { label: string; badge: string }> = {
  pending: {
    label: 'Pending',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  blocked: {
    label: 'Blocked',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
};

const prStatusConfig: Record<string, { label: string; badge: string }> = {
  draft: {
    label: 'Draft',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
  open: {
    label: 'Open',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  merged: {
    label: 'Merged',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  closed: {
    label: 'Closed',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
};

export default function WorkflowStepCard({
  step,
  pullRequests = [],
  onLaunchAgent,
  onViewAgent,
  onMarkComplete,
}: WorkflowStepCardProps) {
  const status = step.status as WorkflowStepStatus;
  const stepType = step.stepType as WorkflowStepType;
  const config = statusConfig[status];
  const label = getWorkflowStepLabel(stepType);

  const canLaunchAgent = status === 'pending' || status === 'blocked';
  const canRerun = status === 'completed';
  const hasAgent = !!step.agentId;
  const canMarkComplete = status === 'in_progress';

  // Filter PRs for this step
  const stepPRs = pullRequests.filter((pr) => pr.workflowStepId === step.id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {label}
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
          {config.label}
        </span>
      </div>

      {/* Agent info */}
      {step.agentId && (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Agent:</span>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
            {step.agentId}
          </code>
        </div>
      )}

      {/* PR info */}
      {stepPRs.length > 0 && (
        <div className="mb-3 space-y-2">
          {stepPRs.map((pr) => {
            const prStatus = prStatusConfig[pr.status] || prStatusConfig.open;
            return (
              <div key={pr.id} className="flex items-center gap-2">
                <a
                  href={pr.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  PR #{pr.prNumber || 'N/A'}: {pr.prTitle}
                </a>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${prStatus.badge}`}>
                  {prStatus.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canLaunchAgent && onLaunchAgent && (
          <button
            onClick={() => onLaunchAgent(step)}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            Launch Agent
          </button>
        )}

        {canRerun && onLaunchAgent && (
          <button
            onClick={() => onLaunchAgent(step)}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Re-run
          </button>
        )}

        {hasAgent && onViewAgent && (
          <button
            onClick={() => onViewAgent(step.agentId!)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            View Agent
          </button>
        )}

        {canMarkComplete && onMarkComplete && (
          <button
            onClick={() => onMarkComplete(step)}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}
