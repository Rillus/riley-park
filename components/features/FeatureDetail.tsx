'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FeatureWithWorkflow,
  WorkflowStep,
  STEP_DISPLAY_NAMES,
  StepType,
  WorkflowStepStatus,
} from '@/lib/features/types';
import { fetchFeature, updateWorkflowStep } from '@/lib/features';
import WorkflowProgress from './WorkflowProgress';

interface FeatureWithProject extends FeatureWithWorkflow {
  project: { id: string; name: string };
}

interface FeatureDetailProps {
  featureId: string;
  onBack: () => void;
  onEdit?: (feature: FeatureWithWorkflow) => void;
  onDelete?: (feature: FeatureWithWorkflow) => void;
  onLaunchAgent?: (step: WorkflowStep) => void;
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStepStatusClasses(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'in_progress':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'blocked':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
  }
}

export default function FeatureDetail({
  featureId,
  onBack,
  onEdit,
  onDelete,
  onLaunchAgent,
}: FeatureDetailProps) {
  const [feature, setFeature] = useState<FeatureWithProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);

  const loadFeature = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchFeature(featureId);
      setFeature(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feature');
    } finally {
      setLoading(false);
    }
  }, [featureId]);

  useEffect(() => {
    loadFeature();
  }, [loadFeature]);

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(step);
  };

  const handleMarkComplete = async (step: WorkflowStep) => {
    setUpdatingStep(step.id);
    try {
      await updateWorkflowStep(step.id, { status: 'completed' });
      await loadFeature(); // Reload to get updated data
    } catch (err) {
      console.error('Failed to update step:', err);
    } finally {
      setUpdatingStep(null);
      setSelectedStep(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading feature...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={loadFeature}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!feature) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(feature)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors text-sm font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(feature)}
              className="px-4 py-2 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Feature Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        {/* Title and Badges */}
        <div className="flex items-start justify-between mb-4">
          <div>
            {feature.project && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {feature.project.name}
              </p>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {feature.title}
            </h1>
          </div>
          <div className="flex gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityClasses(
                feature.priority
              )}`}
            >
              {feature.priority}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(
                feature.status
              )}`}
            >
              {feature.status}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </h2>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {feature.description}
          </p>
        </div>

        {/* Timestamps */}
        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {formatDate(feature.createdAt)}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{' '}
            {formatDate(feature.updatedAt)}
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <WorkflowProgress
          steps={feature.workflowSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Workflow Steps Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Workflow Steps
        </h2>
        <div className="space-y-4">
          {feature.workflowSteps.map((step) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border ${getStepStatusClasses(step.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {STEP_DISPLAY_NAMES[step.stepType as StepType]}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusClasses(
                      step.status
                    )}`}
                  >
                    {step.status}
                  </span>
                </div>
              </div>

              {/* Agent Info */}
              {step.agentId && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Agent: {step.agentId}
                </p>
              )}

              {/* Output */}
              {step.output && (
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                  {step.output}
                </div>
              )}

              {/* Step Actions */}
              <div className="mt-3 flex gap-2">
                {onLaunchAgent && step.status !== 'completed' && (
                  <button
                    onClick={() => onLaunchAgent(step)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  >
                    Launch Agent
                  </button>
                )}
                {step.status !== 'completed' && (
                  <button
                    onClick={() => handleMarkComplete(step)}
                    disabled={updatingStep === step.id}
                    className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors disabled:opacity-50"
                  >
                    {updatingStep === step.id ? 'Updating...' : 'Mark Complete'}
                  </button>
                )}
              </div>

              {/* Last Updated */}
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Updated: {formatDate(step.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Detail Modal */}
      {selectedStep && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {STEP_DISPLAY_NAMES[selectedStep.stepType as StepType]}
              </h2>
              <button
                onClick={() => setSelectedStep(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status:
                </span>{' '}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusClasses(
                    selectedStep.status
                  )}`}
                >
                  {selectedStep.status}
                </span>
              </div>

              {selectedStep.agentId && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Agent ID:
                  </span>{' '}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedStep.agentId}
                  </span>
                </div>
              )}

              {selectedStep.output && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Output:
                  </span>
                  <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                    {selectedStep.output}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {onLaunchAgent && selectedStep.status !== 'completed' && (
                  <button
                    onClick={() => {
                      onLaunchAgent(selectedStep);
                      setSelectedStep(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Launch Agent
                  </button>
                )}
                {selectedStep.status !== WorkflowStepStatus.COMPLETED && (
                  <button
                    onClick={() => handleMarkComplete(selectedStep)}
                    disabled={updatingStep === selectedStep.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {updatingStep === selectedStep.id
                      ? 'Updating...'
                      : 'Mark Complete'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedStep(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
