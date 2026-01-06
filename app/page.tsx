'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LaunchAgentForm from '@/components/agent/LaunchAgentForm';
import FollowupForm from '@/components/agent/FollowupForm';
import AgentStatusDisplay from '@/components/agent/AgentStatus';
import ApiKeySettings from '@/components/settings/ApiKeySettings';
import { LaunchAgentResponse } from '@/lib/cursor-api';
import { agentStore } from '@/lib/agent-store';

function HomeContent() {
  const searchParams = useSearchParams();
  const [launchedAgents, setLaunchedAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [initialRepository, setInitialRepository] = useState('');
  const [initialBranch, setInitialBranch] = useState('');

  useEffect(() => {
    // Check for spec in URL params (from feature loader)
    const specParam = searchParams?.get('spec');
    if (specParam) {
      // Decode and format the spec for the agent prompt
      const decodedSpec = decodeURIComponent(specParam);
      const formattedPrompt = `Please implement the following feature specification:

${decodedSpec}

Please follow the requirements, acceptance criteria, and technical requirements outlined in the specification.`;
      setInitialPrompt(formattedPrompt);
      // Default to current repo if available
      setInitialRepository('https://github.com/riley/riley-park');
      setInitialBranch('main');
    }
  }, [searchParams]);

  const handleAgentLaunched = (agent: LaunchAgentResponse) => {
    agentStore.addAgent(agent);
    setLaunchedAgents((prev) => [...prev, agent.id]);
    setSelectedAgent(agent.id);
  };

  const handleMessageSent = () => {
    // Refresh agent status after sending message
    if (selectedAgent) {
      // The AgentStatus component will auto-refresh
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Riley Park - Agent Manager
          </h1>
          <div className="flex gap-3">
            <Link
              href="/features"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Features
            </Link>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              API Key Settings
            </h2>
            <ApiKeySettings />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Launch New Agent
            </h2>
            <LaunchAgentForm
              onAgentLaunched={handleAgentLaunched}
              initialPrompt={initialPrompt}
              initialRepository={initialRepository}
              initialBranch={initialBranch}
            />
          </div>

          {selectedAgent && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Agent Status
              </h2>
              <AgentStatusDisplay agentId={selectedAgent} />
            </div>
          )}
        </div>

        {selectedAgent && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Send Follow-up Message
            </h2>
            <FollowupForm agentId={selectedAgent} onMessageSent={handleMessageSent} />
          </div>
        )}

        {launchedAgents.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Launched Agents
            </h2>
            <div className="space-y-2">
              {launchedAgents.map((agentId) => (
                <div
                  key={agentId}
                  className={`p-3 rounded-md border transition-colors ${
                    selectedAgent === agentId
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedAgent(agentId)}
                      className="font-mono text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
                    >
                      {agentId}
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedAgent === agentId && (
                        <span className="text-xs text-blue-600">Selected</span>
                      )}
                      <Link
                        href={`/agents/${agentId}/conversation`}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        View Conversation
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>}>
      <HomeContent />
    </Suspense>
  );
}
