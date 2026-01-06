'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentStatus } from '@/lib/cursor-api';

interface AgentActionsProps {
  agentId: string;
  status: AgentStatus;
  onStop?: (agentId: string) => Promise<void>;
  onDelete?: (agentId: string) => Promise<void>;
  prUrl?: string;
  disabled?: boolean;
  className?: string;
}

type ActionType = 'stop' | 'delete' | null;

export default function AgentActions({
  agentId,
  status,
  onStop,
  onDelete,
  prUrl,
  disabled = false,
  className = '',
}: AgentActionsProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);

  const canStop = status === 'RUNNING';
  const canDelete = status === 'FINISHED' || status === 'STOPPED';

  const handleViewConversation = () => {
    router.push(`/agents/${agentId}/conversation`);
  };

  const handleStop = async () => {
    if (!onStop) return;
    setLoading(true);
    try {
      await onStop(agentId);
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setLoading(true);
    try {
      await onDelete(agentId);
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'stop') {
      handleStop();
    } else if (confirmAction === 'delete') {
      handleDelete();
    }
  };

  if (confirmAction) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-600">
          Are you sure?
        </span>
        <button
          onClick={handleConfirmAction}
          disabled={loading}
          className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? (confirmAction === 'stop' ? 'Stopping...' : 'Deleting...') : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirmAction(null)}
          disabled={loading}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* View Conversation */}
      <button
        onClick={handleViewConversation}
        disabled={disabled}
        aria-label="View conversation"
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        title="View conversation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* View PR */}
      {prUrl && (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View pull request"
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
          title="View pull request"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}

      {/* Stop Agent */}
      {canStop && (
        <button
          onClick={() => setConfirmAction('stop')}
          disabled={disabled}
          aria-label="Stop agent"
          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Stop agent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
        </button>
      )}

      {/* Delete Agent */}
      {canDelete && (
        <button
          onClick={() => setConfirmAction('delete')}
          disabled={disabled}
          aria-label="Delete agent"
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete agent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
