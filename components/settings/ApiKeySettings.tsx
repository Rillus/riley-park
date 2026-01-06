'use client';

import { useState, useEffect } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/cursor-api/storage';

export default function ApiKeySettings() {
  const [apiKey, setApiKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getApiKey();
    if (stored) {
      setApiKeyValue(stored);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setApiKeyValue('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium mb-1">
          Cursor API Key
        </label>
        <div className="flex gap-2">
          <input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKeyValue(e.target.value)}
            placeholder="Enter your Cursor API key"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Your API key is stored locally in your browser. Never share it with anyone.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save API Key
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Clear
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          Settings saved!
        </div>
      )}
    </div>
  );
}

