'use client';

import {
  FeatureWithWorkflow,
  WorkflowStep,
  STEP_DISPLAY_NAMES,
  StepType,
  WorkflowStepStatus,
  WORKFLOW_STEPS_ORDER,
} from '@/lib/features/types';

interface FeatureCardProps {
  feature: FeatureWithWorkflow;
  onView: (feature: FeatureWithWorkflow) => void;
  onEdit?: (feature: FeatureWithWorkflow) => void;
  onDelete?: (feature: FeatureWithWorkflow) => void;
}

function getPriorityClasses(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

function getStatusClasses(status: string): string {
  switch (status) {
    case 'planned':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'blocked':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

function getCurrentWorkflowStep(steps: WorkflowStep[]): WorkflowStep | undefined {
  // Find the first step that is in_progress
  const inProgressStep = steps.find((s) => s.status === WorkflowStepStatus.IN_PROGRESS);
  if (inProgressStep) return inProgressStep;

  // Find the first step that is pending based on workflow order
  for (const stepType of WORKFLOW_STEPS_ORDER) {
    const step = steps.find((s) => s.stepType === stepType);
    if (step && step.status === WorkflowStepStatus.PENDING) {
      return step;
    }
  }

  // All steps are completed or blocked, return the last one
  return steps[steps.length - 1];
}

function getCompletedStepsCount(steps: WorkflowStep[]): number {
  return steps.filter((s) => s.status === WorkflowStepStatus.COMPLETED).length;
}

export default function FeatureCard({
  feature,
  onView,
  onEdit,
  onDelete,
}: FeatureCardProps) {
  const currentStep = getCurrentWorkflowStep(feature.workflowSteps);
  const completedSteps = getCompletedStepsCount(feature.workflowSteps);
  const totalSteps = feature.workflowSteps.length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate flex-1 mr-3">
          {feature.title}
        </h3>
        <div className="flex gap-2 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityClasses(
              feature.priority
            )}`}
          >
            {feature.priority}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusClasses(
              feature.status
            )}`}
          >
            {feature.status}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {feature.description}
      </p>

      {/* Workflow Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep && (
              <>
                Current: <span className="font-medium">{STEP_DISPLAY_NAMES[currentStep.stepType as StepType]}</span>
              </>
            )}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completedSteps}/{totalSteps} steps
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onView(feature)}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
        >
          View
        </button>

        {onEdit && (
          <button
            onClick={() => onEdit(feature)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Edit
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(feature)}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
