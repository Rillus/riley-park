'use client';

import { AgentStatus } from '@/lib/cursor-api';

export type FilterValue = 'all' | AgentStatus;

interface StatusFilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  counts?: {
    all: number;
    RUNNING: number;
    FINISHED: number;
    STOPPED: number;
    ERROR: number;
  };
  disabled?: boolean;
  className?: string;
}

const STATUS_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'STOPPED', label: 'Stopped' },
  { value: 'ERROR', label: 'Error' },
];

export default function StatusFilter({
  value,
  onChange,
  counts,
  disabled = false,
  className = '',
}: StatusFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FilterValue)}
      disabled={disabled}
      className={`px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {counts !== undefined && ` (${counts[option.value]})`}
        </option>
      ))}
    </select>
  );
}
