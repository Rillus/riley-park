'use client';

import { AgentStatus } from '@/lib/cursor-api';

interface StatusBadgeProps {
  status: AgentStatus;
  className?: string;
  showPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_COLOURS: Record<AgentStatus, string> = {
  RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
  FINISHED: 'bg-green-100 text-green-800 border-green-200',
  STOPPED: 'bg-gray-100 text-gray-800 border-gray-200',
  ERROR: 'bg-red-100 text-red-800 border-red-200',
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export default function StatusBadge({
  status,
  className = '',
  showPulse = false,
  size = 'sm',
}: StatusBadgeProps) {
  const colourClass = STATUS_COLOURS[status] || STATUS_COLOURS.STOPPED;
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${colourClass} ${sizeClass} ${className}`}
    >
      {showPulse && status === 'RUNNING' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      )}
      {status}
    </span>
  );
}
