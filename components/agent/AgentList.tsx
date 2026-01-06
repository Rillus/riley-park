'use client';

import { useEffect, useState } from 'react';
import { CursorAPIClient, ListAgentsResponse } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';

interface AgentListProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAgentSelect?: (agentId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
  FINISHED: 'bg-green-100 text-green-800 border-green-200',
  STOPPED: 'bg-gray-100 text-gray-800 border-gray-200',
  ERROR: 'bg-red-100 text-red-800 border-red-200',
};

export default function AgentList({
  autoRefresh = true,
  refreshInterval = 5000,
  onAgentSelect,
}: AgentListProps) {
  const [agents, setAgents] = useState<ListAgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError('API key not found');
        setLoading(false);
        return;
      }

      const client = new CursorAPIClient(apiKey);
      const agentsData = await client.listAgents();
      setAgents(agentsData);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch agents'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      fetchAgents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 rounded-md">
        <p className="text-gray-600">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={fetchAgents}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!agents || agents.agents.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-md">
        <p className="text-gray-600">No agents found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">All Agents</h2>
        {autoRefresh && (
          <p className="text-xs text-gray-500">
            Auto-refreshing every {refreshInterval / 1000}s
          </p>
        )}
      </div>

      <div className="space-y-2">
        {agents.agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-4 border rounded-md bg-white hover:bg-gray-50 transition-colors ${
              onAgentSelect ? 'cursor-pointer' : ''
            }`}
            onClick={() => onAgentSelect?.(agent.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {agent.id}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[agent.status] || STATUS_COLORS.STOPPED}`}
                  >
                    {agent.status}
                  </span>
                </div>

                {agent.name && (
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {agent.name}
                  </p>
                )}

                {agent.summary && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {agent.summary}
                  </p>
                )}

                <div className="space-y-1 text-xs text-gray-500">
                  {agent.source?.repository && (
                    <div>
                      <span className="font-medium">Repository:</span>{' '}
                      <span className="font-mono">{agent.source.repository}</span>
                    </div>
                  )}
                  {agent.source?.ref && (
                    <div>
                      <span className="font-medium">Branch:</span>{' '}
                      <span>{agent.source.ref}</span>
                    </div>
                  )}
                  {agent.target?.branchName && (
                    <div>
                      <span className="font-medium">Target Branch:</span>{' '}
                      <span>{agent.target.branchName}</span>
                    </div>
                  )}
                  {agent.createdAt && (
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      <span>{new Date(agent.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {agent.target?.url && (
                <a
                  href={agent.target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  View →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

