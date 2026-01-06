'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentDashboard } from '@/components/dashboard';
import ApiKeySettings from '@/components/settings/ApiKeySettings';

export default function DashboardPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Agent Status Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Monitor and manage all your Cursor Cloud Agents
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Launch Agent
            </Link>
            <Link
              href="/features"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              Features
            </Link>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              API Key Settings
            </h2>
            <ApiKeySettings />
          </div>
        )}

        {/* Selected Agent Info */}
        {selectedAgent && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-blue-600 dark:text-blue-400">
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <span className="text-blue-800 dark:text-blue-200">
                  Selected agent:{' '}
                  <span className="font-mono font-medium">{selectedAgent}</span>
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/agents/${selectedAgent}/conversation`}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  View Conversation
                </Link>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <AgentDashboard
            autoRefresh={true}
            refreshInterval={5000}
            onAgentSelect={setSelectedAgent}
          />
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Click on an agent row to select it, or use the action buttons on the right.
          </p>
          <p className="mt-1">
            The dashboard auto-refreshes every 5 seconds. Status changes are highlighted.
          </p>
        </div>
      </div>
    </div>
  );
}
