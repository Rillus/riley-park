'use client';

import { useState, useEffect } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/cursor-api/storage';
import { getGitHubToken, setGitHubToken, clearGitHubToken } from '@/lib/github/storage';

export default function ApiKeySettings() {
  const [apiKey, setApiKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [githubToken, setGitHubTokenValue] = useState('');
  const [showGitHubToken, setShowGitHubToken] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedApiKey = getApiKey();
    if (storedApiKey) {
      setApiKeyValue(storedApiKey);
    }
    const storedGitHubToken = getGitHubToken();
    if (storedGitHubToken) {
      setGitHubTokenValue(storedGitHubToken);
    }
  }, []);

  const handleSave = () => {
    let hasChanges = false;
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      hasChanges = true;
    }
    if (githubToken.trim()) {
      setGitHubToken(githubToken.trim());
      hasChanges = true;
    }
    if (hasChanges) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setApiKeyValue('');
    clearGitHubToken();
    setGitHubTokenValue('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cursor API Key Section */}
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
          Cursor API Key
        </label>
        <div className="flex gap-2">
          <input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKeyValue(e.target.value)}
            placeholder="Enter your Cursor API key"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Your API key is stored locally in your browser. Never share it with anyone.
        </p>
      </div>

      {/* GitHub Token Section */}
      <div>
        <label htmlFor="github-token" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
          GitHub Personal Access Token
        </label>
        <div className="flex gap-2">
          <input
            id="github-token"
            type={showGitHubToken ? 'text' : 'password'}
            value={githubToken}
            onChange={(e) => setGitHubTokenValue(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => setShowGitHubToken(!showGitHubToken)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            {showGitHubToken ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Required for syncing features from private repositories. Your token is stored locally in your browser.
        </p>
        
        {/* Instructions */}
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            How to get a GitHub Personal Access Token:
          </p>
          <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-400">GitHub Settings → Developer settings → Personal access tokens</a></li>
            <li>Click &quot;Generate new token&quot; → &quot;Generate new token (classic)&quot;</li>
            <li>Give it a name (e.g., &quot;Riley Park Feature Sync&quot;)</li>
            <li>Select the <code className="bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded">repo</code> scope (for private repos) or just leave it for public repos</li>
            <li>Click &quot;Generate token&quot; and copy the token</li>
            <li>Paste it above and click &quot;Save Settings&quot;</li>
          </ol>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
            <strong>Note:</strong> For public repositories, a token is optional but recommended to avoid rate limits.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Save Settings
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Clear All
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
          Settings saved!
        </div>
      )}
    </div>
  );
}

