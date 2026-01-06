'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CursorAPIClient, ListAgentsResponse, AgentStatus } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';
import StatusBadge from './StatusBadge';
import StatusFilter, { FilterValue } from './StatusFilter';
import TimeElapsed from './TimeElapsed';
import AgentActions from './AgentActions';

interface AgentDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAgentSelect?: (agentId: string) => void;
}

interface AgentWithHighlight {
  id: string;
  name?: string;
  status: AgentStatus;
  previousStatus?: AgentStatus;
  source?: {
    repository: string;
    ref?: string;
  };
  target?: {
    branchName?: string;
    url?: string;
    prUrl?: string;
    autoCreatePr?: boolean;
    openAsCursorGithubApp?: boolean;
    skipReviewerRequest?: boolean;
  };
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
  isHighlighted?: boolean;
}

export default function AgentDashboard({
  autoRefresh = true,
  refreshInterval = 5000,
  onAgentSelect,
}: AgentDashboardProps) {
  const [agents, setAgents] = useState<AgentWithHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<FilterValue>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const previousAgentsRef = useRef<Map<string, AgentStatus>>(new Map());

  const fetchAgents = useCallback(async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError('API key not found');
        setLoading(false);
        return;
      }

      const client = new CursorAPIClient(apiKey);
      const response: ListAgentsResponse = await client.listAgents();
      
      // Check for status changes and highlight
      const previousStatuses = previousAgentsRef.current;
      const newAgents: AgentWithHighlight[] = response.agents.map((agent) => {
        const previousStatus = previousStatuses.get(agent.id);
        const isHighlighted = previousStatus !== undefined && previousStatus !== agent.status;
        return {
          ...agent,
          previousStatus,
          isHighlighted,
        };
      });

      // Update previous statuses
      const newPreviousStatuses = new Map<string, AgentStatus>();
      response.agents.forEach((agent) => {
        newPreviousStatuses.set(agent.id, agent.status);
      });
      previousAgentsRef.current = newPreviousStatuses;

      setAgents(newAgents);
      setLastUpdated(new Date());
      setError(null);

      // Clear highlights after 3 seconds
      setTimeout(() => {
        setAgents((prev) =>
          prev.map((agent) => ({ ...agent, isHighlighted: false }))
        );
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStop = useCallback(async (agentId: string) => {
    try {
      setActionLoading(agentId);
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const client = new CursorAPIClient(apiKey);
      await client.stopAgent(agentId);
      
      // Refresh the list
      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop agent');
    } finally {
      setActionLoading(null);
    }
  }, [fetchAgents]);

  const handleDelete = useCallback(async (agentId: string) => {
    try {
      setActionLoading(agentId);
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const client = new CursorAPIClient(apiKey);
      await client.deleteAgent(agentId);
      
      // Refresh the list
      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setActionLoading(null);
    }
  }, [fetchAgents]);

  useEffect(() => {
    fetchAgents();

    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(fetchAgents, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAgents]);

  // Calculate status counts
  const statusCounts = {
    all: agents.length,
    RUNNING: agents.filter((a) => a.status === 'RUNNING').length,
    FINISHED: agents.filter((a) => a.status === 'FINISHED').length,
    STOPPED: agents.filter((a) => a.status === 'STOPPED').length,
    ERROR: agents.filter((a) => a.status === 'ERROR').length,
  };

  // Filter agents
  const filteredAgents = filterValue === 'all'
    ? agents
    : agents.filter((agent) => agent.status === filterValue);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
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
          <span>Loading agents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-red-700">Error: {error}</span>
        </div>
        <button
          onClick={fetchAgents}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Agent Dashboard
          </h2>
          <StatusFilter
            value={filterValue}
            onChange={setFilterValue}
            counts={statusCounts}
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {lastUpdated && (
            <span>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {autoRefresh && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Auto-refresh
            </span>
          )}
          <button
            onClick={fetchAgents}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Agent List */}
      {filteredAgents.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No agents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterValue !== 'all'
              ? `No agents with status "${filterValue}".`
              : 'Launch a new agent to get started.'}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Elapsed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.map((agent) => (
                <tr
                  key={agent.id}
                  data-agent-id={agent.id}
                  onClick={() => onAgentSelect?.(agent.id)}
                  className={`
                    ${onAgentSelect ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${agent.isHighlighted ? 'ring-2 ring-yellow-400 ring-inset bg-yellow-50' : ''}
                    transition-all duration-300
                  `}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {agent.id}
                    </span>
                    {agent.name && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {agent.name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={agent.status}
                      showPulse={agent.status === 'RUNNING'}
                    />
                  </td>
                  <td className="px-4 py-4">
                    {agent.source?.repository ? (
                      <span className="text-sm text-gray-600 truncate block max-w-[250px]">
                        {agent.source.repository}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {agent.source?.ref || agent.target?.branchName ? (
                      <span className="text-sm text-gray-600">
                        {agent.source?.ref || agent.target?.branchName}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {agent.createdAt ? (
                      <TimeElapsed
                        startTime={agent.createdAt}
                        live={agent.status === 'RUNNING'}
                      />
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {agent.createdAt ? (
                      <span className="text-sm text-gray-600">
                        {new Date(agent.createdAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <AgentActions
                      agentId={agent.id}
                      status={agent.status}
                      prUrl={agent.target?.prUrl}
                      onStop={handleStop}
                      onDelete={handleDelete}
                      disabled={actionLoading === agent.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
        <span>
          Showing {filteredAgents.length} of {agents.length} agents
        </span>
        {autoRefresh && (
          <span>
            Refreshing every {refreshInterval / 1000}s
          </span>
        )}
      </div>
    </div>
  );
}
