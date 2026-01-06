'use client';

import { WorkflowStep, WorkflowStepStatus } from '@/lib/features/types';
import { getWorkflowStepLabel, WorkflowStepType } from '@/lib/agent-launch';

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
}

// Status colours
const statusColors: Record<WorkflowStepStatus, { bg: string; border: string; text: string }> = {
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-500 dark:text-gray-400',
  },
  in_progress: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-300',
  },
  blocked: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-700 dark:text-red-300',
  },
};

// Status icons
function StatusIcon({ status }: { status: WorkflowStepStatus }) {
  switch (status) {
    case 'completed':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    case 'blocked':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return (
        <span className="w-2 h-2 rounded-full bg-current" />
      );
  }
}

function calculateProgress(steps: WorkflowStep[]): number {
  if (steps.length === 0) return 0;
  
  let progress = 0;
  for (const step of steps) {
    if (step.status === 'completed') {
      progress += 1;
    } else if (step.status === 'in_progress') {
      progress += 0.5;
    }
  }
  
  return Math.round((progress / steps.length) * 100);
}

export default function WorkflowProgress({
  steps,
  onStepClick,
}: WorkflowProgressProps) {
  const progress = calculateProgress(steps);
  const isClickable = !!onStepClick;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative">
        <div
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-right">
          {progress}% complete
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const colors = statusColors[step.status as WorkflowStepStatus];
          const label = getWorkflowStepLabel(step.stepType as WorkflowStepType);
          
          return (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              {/* Connector line */}
              {index > 0 && (
                <div className="absolute w-full h-0.5 bg-gray-300 dark:bg-gray-600" style={{ left: '-50%', width: '100%' }} />
              )}
              
              {/* Step circle */}
              <div
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={() => onStepClick?.(step)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStepClick?.(step);
                  }
                }}
                data-testid={`step-${step.status}`}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${colors.bg} ${colors.border} ${colors.text}
                  ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-2' : ''}
                  transition-all duration-200
                `}
              >
                <StatusIcon status={step.status as WorkflowStepStatus} />
              </div>
              
              {/* Step label */}
              <span className={`mt-2 text-xs font-medium text-center ${colors.text}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
