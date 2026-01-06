'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CursorAPIClient, AgentStatusResponse, AgentStatus } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';

interface AgentStatusProps {
  agentId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
  FINISHED: 'bg-green-100 text-green-800 border-green-200',
  STOPPED: 'bg-gray-100 text-gray-800 border-gray-200',
  ERROR: 'bg-red-100 text-red-800 border-red-200',
};

export default function AgentStatusDisplay({
  agentId,
  autoRefresh = true,
  refreshInterval = 5000,
}: AgentStatusProps) {
  const [status, setStatus] = useState<AgentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError('API key not found');
        setLoading(false);
        return;
      }

      const client = new CursorAPIClient(apiKey);
      const agentStatus = await client.getAgentStatus(agentId);
      setStatus(agentStatus);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch agent status'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      if (status?.status === 'RUNNING') {
        fetchStatus();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [agentId, autoRefresh, refreshInterval, status?.status]);

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 rounded-md">
        <p className="text-gray-600">Loading agent status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 border border-gray-200 rounded-md">
        <p className="text-gray-600">No status information available</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-white">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Agent Status</h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status.status]}`}
          >
            {status.status}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Agent ID:</span>
            <span className="ml-2 text-gray-600 font-mono">{status.id}</span>
          </div>

          {status.repository && (
            <div>
              <span className="font-medium text-gray-700">Repository:</span>
              <span className="ml-2 text-gray-600">{status.repository}</span>
            </div>
          )}

          {status.branch && (
            <div>
              <span className="font-medium text-gray-700">Branch:</span>
              <span className="ml-2 text-gray-600">{status.branch}</span>
            </div>
          )}

          {status.createdAt && (
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <span className="ml-2 text-gray-600">
                {new Date(status.createdAt).toLocaleString()}
              </span>
            </div>
          )}

          {status.updatedAt && (
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-600">
                {new Date(status.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {autoRefresh && status.status === 'RUNNING' && (
          <p className="text-xs text-gray-500 mt-2">
            Auto-refreshing every {refreshInterval / 1000} seconds...
          </p>
        )}

        {/* Link to conversation view */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href={`/agents/${agentId}/conversation`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <span>View Conversation</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

