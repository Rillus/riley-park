'use client';

import { WorkflowStep, WorkflowStepStatus } from '@/lib/features/types';
import { getWorkflowStepLabel, WorkflowStepType } from '@/lib/agent-launch';

interface WorkflowStepCardProps {
  step: WorkflowStep;
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

export default function WorkflowStepCard({
  step,
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
