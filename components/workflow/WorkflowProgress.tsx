'use client';

import { WORKFLOW_STEP_TYPES, WORKFLOW_STEP_LABELS, WorkflowStepData, WorkflowStepStatus } from '@/lib/workflow/types';

interface WorkflowProgressProps {
  steps: WorkflowStepData[];
  currentStepType?: string;
  onStepClick?: (step: WorkflowStepData) => void;
  compact?: boolean;
}

const STATUS_COLORS: Record<WorkflowStepStatus, { bg: string; border: string; text: string }> = {
  pending: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-500',
  },
  in_progress: {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-700',
  },
  completed: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700',
  },
  blocked: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-700',
  },
};

const STATUS_ICONS: Record<WorkflowStepStatus, React.ReactNode> = {
  pending: (
    <div className="h-3 w-3 rounded-full bg-gray-300" />
  ),
  in_progress: (
    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
  ),
  completed: (
    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  blocked: (
    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export default function WorkflowProgress({
  steps,
  currentStepType,
  onStepClick,
  compact = false,
}: WorkflowProgressProps) {
  // Create a map of steps by type for easy lookup
  const stepsByType = new Map(steps.map((s) => [s.stepType, s]));

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        {WORKFLOW_STEP_TYPES.map((stepType, index) => {
          const step = stepsByType.get(stepType);
          const status = step?.status || 'pending';
          const colors = STATUS_COLORS[status];
          const isCurrent = stepType === currentStepType;
          const isLast = index === WORKFLOW_STEP_TYPES.length - 1;

          return (
            <div
              key={stepType}
              className={`flex items-center ${isLast ? '' : 'flex-1'}`}
            >
              {/* Step circle */}
              <button
                onClick={() => step && onStepClick?.(step)}
                disabled={!onStepClick || !step}
                className={`
                  flex items-center justify-center
                  ${compact ? 'h-8 w-8' : 'h-10 w-10'}
                  rounded-full border-2 transition-all
                  ${colors.bg} ${colors.border}
                  ${onStepClick && step ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                `}
                title={`${WORKFLOW_STEP_LABELS[stepType]}: ${status}`}
              >
                {STATUS_ICONS[status]}
              </button>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-1 mx-2
                    ${step?.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      {!compact && (
        <div className="flex items-start justify-between mt-2">
          {WORKFLOW_STEP_TYPES.map((stepType, index) => {
            const step = stepsByType.get(stepType);
            const status = step?.status || 'pending';
            const colors = STATUS_COLORS[status];
            const isLast = index === WORKFLOW_STEP_TYPES.length - 1;

            return (
              <div
                key={`label-${stepType}`}
                className={`
                  text-center
                  ${isLast ? '' : 'flex-1'}
                `}
                style={{ minWidth: compact ? '2rem' : '4rem' }}
              >
                <p className={`text-xs font-medium ${colors.text}`}>
                  {WORKFLOW_STEP_LABELS[stepType]}
                </p>
                {step?.agentId && status === 'in_progress' && (
                  <p className="text-[10px] text-gray-400 truncate">
                    Agent running
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
