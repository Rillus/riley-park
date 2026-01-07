'use client';

import { useState, useEffect } from 'react';
import { CursorAPIClient, LaunchAgentRequest, LaunchAgentResponse } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';

interface LaunchAgentFormProps {
  onAgentLaunched?: (agent: LaunchAgentResponse) => void;
  initialPrompt?: string;
  initialRepository?: string;
  initialBranch?: string;
}

// Default repository URL
const DEFAULT_REPOSITORY = 'https://github.com/rillus/riley-park';

// Generate branch name from feature ID
function generateBranchName(featureId?: string): string {
  if (!featureId) {
    return 'riley-park/feature/task';
  }
  
  // Extract feature number and name from ID (e.g., "002-agent-conversation-view" -> "002-agent-conversation-view")
  // Or "001b-feature-list" -> "001b-feature-list"
  const cleanId = featureId.replace(/^(\d+[a-z]?)-/, '$1-');
  return `riley-park/feature/${cleanId}`;
}

export default function LaunchAgentForm({ 
  onAgentLaunched,
  initialPrompt = '',
  initialRepository = '',
  initialBranch = '',
}: LaunchAgentFormProps) {
  const [repository, setRepository] = useState(initialRepository || DEFAULT_REPOSITORY);
  const [branch, setBranch] = useState(initialBranch);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState('Auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update form when initial values change
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialRepository) {
      setRepository(initialRepository);
    } else {
      setRepository(DEFAULT_REPOSITORY);
    }
    if (initialBranch) {
      setBranch(initialBranch);
    } else if (initialPrompt) {
      // If we have a prompt but no branch, try to extract feature ID from prompt
      // Look for "Feature XXX:" pattern
      const featureMatch = initialPrompt.match(/Feature\s+(\d+[a-z]?)[:\-]/i);
      if (featureMatch) {
        const featureId = featureMatch[1];
        setBranch(generateBranchName(featureId));
      }
    }
  }, [initialPrompt, initialRepository, initialBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError('API key not found. Please set your Cursor API key in settings.');
        setLoading(false);
        return;
      }

      const client = new CursorAPIClient(apiKey);
      const request: LaunchAgentRequest = {
        repository,
        branch: branch || undefined,
        prompt,
        model: model || 'Auto',
      };

      const response = await client.launchAgent(request);
      setSuccess(`Agent launched successfully! Agent ID: ${response.id}`);
      
      if (onAgentLaunched) {
        onAgentLaunched(response);
      }

      // Reset form (but keep default repository)
      setRepository(DEFAULT_REPOSITORY);
      setBranch('');
      setPrompt('');
    } catch (err) {
      let errorMessage = 'Failed to launch agent. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Try to extract more detailed error from the error message
        try {
          const errorObj = JSON.parse(err.message);
          if (errorObj.error) {
            errorMessage = errorObj.error;
            if (errorObj.suggestion) {
              errorMessage += ` ${errorObj.suggestion}`;
            }
          }
        } catch {
          // If parsing fails, use the original message
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="repository" className="block text-sm font-medium mb-1">
          Repository URL *
        </label>
        <input
          id="repository"
          type="url"
          value={repository}
          onChange={(e) => setRepository(e.target.value)}
          required
          placeholder={DEFAULT_REPOSITORY}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="branch" className="block text-sm font-medium mb-1">
          Branch Name (optional)
        </label>
        <input
          id="branch"
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="riley-park/feature/002-agent-conversation-view"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium mb-1">
          Initial Prompt *
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={4}
          placeholder="Describe what you want the agent to do..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="model" className="block text-sm font-medium mb-1">
          Model
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Auto">Auto</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Launching...' : 'Launch Agent'}
      </button>
    </form>
  );
}

