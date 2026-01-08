'use client';

import { useState, useEffect, useRef } from 'react';
import { CursorAPIClient, LaunchAgentRequest, LaunchAgentResponse } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';
import { getGitHubToken } from '@/lib/github/storage';
import { fetchShortcuts, expandShortcut, Shortcut } from '@/lib/shortcuts/client';

interface LaunchAgentFormProps {
  onAgentLaunched?: (agent: LaunchAgentResponse) => void;
  initialPrompt?: string;
  initialRepository?: string;
  initialBranch?: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
}

export default function LaunchAgentForm({ 
  onAgentLaunched,
  initialPrompt = '',
  initialRepository = '',
  initialBranch = '',
}: LaunchAgentFormProps) {
  const [repository, setRepository] = useState(initialRepository || '');
  const [branch, setBranch] = useState(initialBranch || '');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState('Auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(false);
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);
  
  // Repository typeahead state
  const [repositoryQuery, setRepositoryQuery] = useState(initialRepository || '');
  const [repositorySuggestions, setRepositorySuggestions] = useState<GitHubRepository[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const repositoryInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load shortcuts on mount
  useEffect(() => {
    setShortcutsLoading(true);
    fetchShortcuts()
      .then((data) => {
        setShortcuts(data.shortcuts);
      })
      .catch((err) => {
        console.error('Failed to load shortcuts:', err);
      })
      .finally(() => {
        setShortcutsLoading(false);
      });
  }, []);

  // Fetch GitHub repositories for typeahead
  useEffect(() => {
    // Only search if query doesn't look like a URL and has no slashes
    if (!repositoryQuery.trim() || repositoryQuery.includes('/') || repositoryQuery.includes('github.com') || repositoryQuery.startsWith('http')) {
      setRepositorySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      const token = getGitHubToken();
      if (!token) {
        setRepositorySuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingRepos(true);
      try {
        const response = await fetch(
          `/api/github/repositories?q=${encodeURIComponent(repositoryQuery)}&token=${encodeURIComponent(token)}`
        );
        if (response.ok) {
          const data = await response.json();
          setRepositorySuggestions(data.repositories || []);
          if (data.repositories && data.repositories.length > 0) {
            setShowSuggestions(true);
          }
        } else {
          setRepositorySuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Failed to fetch repositories:', err);
        setRepositorySuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingRepos(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(searchTimeout);
  }, [repositoryQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        repositoryInputRef.current &&
        !repositoryInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRepositorySelect = (repo: GitHubRepository) => {
    setRepository(repo.html_url);
    setRepositoryQuery(repo.html_url);
    setShowSuggestions(false);
    if (repositoryInputRef.current) {
      repositoryInputRef.current.focus();
    }
  };

  // Handle shortcut selection
  const handleShortcutSelect = async (shortcut: Shortcut) => {
    setSelectedShortcutId(shortcut.id);
    
    try {
      // Extract project name from repository URL if possible
      const repoMatch = repository.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      const projectName = repoMatch ? repoMatch[2] : undefined;
      
      const expandedPrompt = await expandShortcut(shortcut.id, {
        feature: undefined,
        project: projectName,
        step: undefined,
        description: undefined,
      });
      
      setPrompt(expandedPrompt);
    } catch (err) {
      console.error('Failed to expand shortcut:', err);
      setError('Failed to expand shortcut');
    }
  };

  // Update form when initial values change
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialRepository) {
      setRepository(initialRepository);
      setRepositoryQuery(initialRepository);
    }
    // Always default branch to blank
    setBranch(initialBranch || '');
  }, [initialPrompt, initialRepository, initialBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate repository is set
    if (!repository || !repository.trim()) {
      setError('Please select or enter a repository URL.');
      return;
    }

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

      // Reset form
      setRepository('');
      setRepositoryQuery('');
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
      <div className="relative">
        <label htmlFor="repository" className="block text-sm font-medium mb-1">
          Repository URL *
        </label>
        <input
          ref={repositoryInputRef}
          id="repository"
          type="text"
          value={repositoryQuery}
          onChange={(e) => {
            const value = e.target.value;
            setRepositoryQuery(value);
            // If user types a full URL, set it directly
            if (value.includes('github.com') || value.startsWith('http')) {
              setRepository(value);
            } else if (value.trim() === '') {
              setRepository('');
            }
          }}
          onFocus={() => {
            if (repositorySuggestions.length > 0 && repositoryQuery.trim() && !repositoryQuery.includes('/')) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder="Search GitHub repositories or enter URL..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {loadingRepos && (
          <div className="absolute right-3 top-9 text-gray-400 text-sm">
            Searching...
          </div>
        )}

        {showSuggestions && repositorySuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {repositorySuggestions.map((repo) => (
              <button
                key={repo.id}
                type="button"
                onClick={() => handleRepositorySelect(repo)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              >
                <div className="font-medium text-gray-900">{repo.full_name}</div>
                {repo.description && (
                  <div className="text-sm text-gray-500 truncate">{repo.description}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {repositoryQuery && !showSuggestions && !loadingRepos && !getGitHubToken() && (
          <p className="mt-1 text-xs text-gray-500">
            Enter a GitHub repository URL or set a GitHub token in settings to search repositories
          </p>
        )}
      </div>

      <div>
        <label htmlFor="branch" className="block text-sm font-medium mb-1">
          Branch Name
        </label>
        <input
          id="branch"
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Leave blank for default branch"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Shortcut Selector */}
      {shortcuts.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Quick Shortcuts
          </label>
          <div className="flex flex-wrap gap-2">
            {shortcuts.slice(0, 5).map((shortcut) => (
              <button
                key={shortcut.id}
                type="button"
                onClick={() => handleShortcutSelect(shortcut)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedShortcutId === shortcut.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {shortcut.name}
              </button>
            ))}
          </div>
          {shortcuts.length > 5 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              +{shortcuts.length - 5} more shortcuts available
            </p>
          )}
        </div>
      )}

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

