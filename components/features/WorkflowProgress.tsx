'use client';

import {
  WorkflowStep,
  StepType,
  WorkflowStepStatus,
  WORKFLOW_STEPS_ORDER,
} from '@/lib/features/types';

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  onStepClick: (step: WorkflowStep) => void;
}

// Short display names for the workflow progress view
const STEP_SHORT_NAMES: Record<StepType, string> = {
  [StepType.SPEC]: 'Spec',
  [StepType.DESIGN]: 'Design',
  [StepType.IMPLEMENT]: 'Implement',
  [StepType.REVIEW]: 'Review',
  [StepType.TEST]: 'Test',
  [StepType.SUBMIT]: 'Submit',
};

function getStepClasses(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200';
    case 'in_progress':
      return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-800 dark:text-blue-200';
    case 'blocked':
      return 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200';
    case 'pending':
    default:
      return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400';
  }
}

function getConnectorClasses(prevStatus: string): string {
  if (prevStatus === 'completed') {
    return 'bg-green-500';
  }
  return 'bg-gray-300 dark:bg-gray-600';
}

function CheckIcon() {
  return (
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function BlockedIcon() {
  return (
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
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      data-testid="agent-indicator"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

export default function WorkflowProgress({
  steps,
  onStepClick,
}: WorkflowProgressProps) {
  // Sort steps by workflow order
  const sortedSteps = [...steps].sort((a, b) => {
    const aIndex = WORKFLOW_STEPS_ORDER.indexOf(a.stepType as StepType);
    const bIndex = WORKFLOW_STEPS_ORDER.indexOf(b.stepType as StepType);
    return aIndex - bIndex;
  });

  const completedCount = steps.filter((s) => s.status === WorkflowStepStatus.COMPLETED).length;
  const progressPercentage = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Workflow Progress
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {progressPercentage}% Complete ({completedCount}/{steps.length})
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {sortedSteps.map((step, index) => {
          const isLast = index === sortedSteps.length - 1;
          const prevStep = index > 0 ? sortedSteps[index - 1] : null;

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              {/* Step Button */}
              <button
                onClick={() => onStepClick(step)}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:shadow-md min-w-[80px] ${getStepClasses(
                  step.status
                )}`}
              >
                {/* Status Icon */}
                <div className="mb-1">
                  {step.status === 'completed' && <CheckIcon />}
                  {step.status === 'in_progress' && <SpinnerIcon />}
                  {step.status === 'blocked' && <BlockedIcon />}
                  {step.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-current" />
                  )}
                </div>

                {/* Step Name */}
                <span className="text-xs font-medium">
                  {STEP_SHORT_NAMES[step.stepType as StepType]}
                </span>

                {/* Agent Indicator */}
                {step.agentId && (
                  <div className="mt-1 text-current opacity-75">
                    <AgentIcon />
                  </div>
                )}
              </button>

              {/* Connector */}
              {!isLast && (
                <div
                  data-testid="step-connector"
                  className={`h-1 w-8 mx-1 rounded ${
                    prevStep
                      ? getConnectorClasses(step.status)
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
