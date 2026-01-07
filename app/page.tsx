'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LaunchAgentForm from '@/components/agent/LaunchAgentForm';
import FollowupForm from '@/components/agent/FollowupForm';
import AgentStatusDisplay from '@/components/agent/AgentStatus';
import AgentList from '@/components/agent/AgentList';
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

  // Open settings if query parameter is present
  useEffect(() => {
    if (searchParams?.get('settings') === 'true') {
      setShowSettings(true);
      // Scroll to settings after a brief delay
      setTimeout(() => {
        const settingsElement = document.getElementById('settings');
        if (settingsElement) {
          settingsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check for spec in URL params (from feature loader)
    const specParam = searchParams?.get('spec');
    const featureIdParam = searchParams?.get('featureId');
    
    if (specParam) {
      // Decode and format the spec for the agent prompt
      const decodedSpec = decodeURIComponent(specParam);
      const formattedPrompt = `Please implement the following feature specification:

${decodedSpec}

Please follow the requirements, acceptance criteria, and technical requirements outlined in the specification.`;
      setInitialPrompt(formattedPrompt);
      // Default to current repo
      setInitialRepository('https://github.com/rillus/riley-park');
      // Generate branch name from feature ID: riley-park/feature/{feature-id}
      if (featureIdParam) {
        const featureId = decodeURIComponent(featureIdParam);
        setInitialBranch(`riley-park/feature/${featureId}`);
      } else {
        // Try to extract feature number from spec title
        const featureMatch = decodedSpec.match(/^#\s+Feature\s+(\d+[a-z]?)[:\-]/im);
        if (featureMatch) {
          const featureNum = featureMatch[1];
          // Extract feature name from title
          const nameMatch = decodedSpec.match(/^#\s+Feature\s+\d+[a-z]?[:\-]\s*(.+)$/im);
          const featureName = nameMatch 
            ? nameMatch[1].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            : 'feature';
          setInitialBranch(`riley-park/feature/${featureNum}-${featureName}`);
        } else {
          setInitialBranch('riley-park/feature/task');
        }
      }
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
              href="/projects"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Projects
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <Link
              href="/features"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Features
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
          <div id="settings" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Settings
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <AgentList
            autoRefresh={true}
            refreshInterval={5000}
            onAgentSelect={setSelectedAgent}
          />
        </div>
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
