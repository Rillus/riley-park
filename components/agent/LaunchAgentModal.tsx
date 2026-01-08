'use client';

import { useState, useEffect } from 'react';
import { CursorAPIClient, LaunchAgentRequest, LaunchAgentResponse } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';
import { generateBranchName } from '@/lib/agent-launch/branch-name';
import { generateStepPrompt, getWorkflowStepLabel, WorkflowStepType } from '@/lib/agent-launch/prompt-templates';
import { fetchShortcuts, expandShortcut, Shortcut } from '@/lib/shortcuts/client';
import { ContextPromptResult } from '@/lib/context/types';

interface ProjectContext {
  id: string;
  name: string;
  repositoryUrl: string;
  defaultBranch: string;
}

interface FeatureContext {
  id: string;
  title: string;
  description: string;
}

interface WorkflowStepContext {
  id: string;
  stepType: WorkflowStepType;
}

interface LaunchAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentLaunched?: (agent: LaunchAgentResponse, workflowStepId?: string) => void;
  project: ProjectContext;
  feature?: FeatureContext;
  workflowStep?: WorkflowStepContext;
}

export default function LaunchAgentModal({
  isOpen,
  onClose,
  onAgentLaunched,
  project,
  feature,
  workflowStep,
}: LaunchAgentModalProps) {
  const [repository, setRepository] = useState('');
  const [branch, setBranch] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('Auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextWarning, setContextWarning] = useState<string | null>(null);
  const [contextPreview, setContextPreview] = useState<string | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(false);
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);
  const [showContextPreview, setShowContextPreview] = useState(false);

  // Load shortcuts when modal opens
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  // Load context preview
  const loadContextPreview = async () => {
    if (!feature || !project) return;

    setContextLoading(true);
    setContextWarning(null);
    try {
      const contextResponse = await fetch('/api/context/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          featureId: feature.id,
          includeProjectContext: true,
          includeFeatureContext: true,
          maxTokens: 8000,
        }),
      });

      if (contextResponse.ok) {
        const contextResult: ContextPromptResult = await contextResponse.json();
        setContextPreview(contextResult.prompt || null);
        
        if (contextResult.warning) {
          setContextWarning(contextResult.warning);
        }
      }
    } catch (err) {
      console.error('Failed to load context preview:', err);
    } finally {
      setContextLoading(false);
    }
  };

  // Handle shortcut selection
  const handleShortcutSelect = async (shortcut: Shortcut) => {
    setSelectedShortcutId(shortcut.id);
    
    // Expand shortcut with variables
    try {
      const expandedPrompt = await expandShortcut(shortcut.id, {
        feature: feature?.title,
        project: project.name,
        step: workflowStep ? getWorkflowStepLabel(workflowStep.stepType) : undefined,
        description: feature?.description,
      });
      
      // If we have a feature, prepend context
      if (feature && workflowStep) {
        const contextResponse = await fetch('/api/context/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: project.id,
            featureId: feature.id,
            includeProjectContext: true,
            includeFeatureContext: true,
            maxTokens: 8000,
          }),
        });

        if (contextResponse.ok) {
          const contextResult: ContextPromptResult = await contextResponse.json();
          let fullPrompt = expandedPrompt;

          // Prepend context if available
          if (contextResult.prompt) {
            fullPrompt = `${contextResult.prompt}\n\n---\n\n${expandedPrompt}`;
          }

          setPrompt(fullPrompt);
          setContextPreview(contextResult.prompt || null);
          
          if (contextResult.warning) {
            setContextWarning(contextResult.warning);
          }
        } else {
          setPrompt(expandedPrompt);
        }
      } else {
        setPrompt(expandedPrompt);
      }
      
      // Show context preview if available
      if (feature && project) {
        setShowContextPreview(true);
        await loadContextPreview();
      }
    } catch (err) {
      console.error('Failed to expand shortcut:', err);
      setError('Failed to expand shortcut');
    }
  };

  // Initialise form values when modal opens or context changes
  useEffect(() => {
    if (isOpen) {
      setRepository(project.repositoryUrl);
      setError(null);
      setContextWarning(null);
      setContextPreview(null);
      setShowContextPreview(false);
      setSelectedShortcutId(null);
      // Always default branch to blank
      setBranch('');
      
      async function loadPrompt() {
        if (feature && workflowStep) {
          // Generate step-specific prompt
          const stepPrompt = generateStepPrompt(workflowStep.stepType, {
            featureName: feature.title,
            featureDescription: feature.description,
          });

          // Fetch context and build full prompt
          setContextLoading(true);
          try {
            const contextResponse = await fetch('/api/context/prompt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                projectId: project.id,
                featureId: feature.id,
                includeProjectContext: true,
                includeFeatureContext: true,
                maxTokens: 8000,
              }),
            });

            if (contextResponse.ok) {
              const contextResult: ContextPromptResult = await contextResponse.json();
              let fullPrompt = stepPrompt;

              // Prepend context if available
              if (contextResult.prompt) {
                fullPrompt = `${contextResult.prompt}\n\n---\n\n${stepPrompt}`;
              }

              // Add feature description if not already in context
              if (!contextResult.prompt || !contextResult.prompt.includes('Feature Description')) {
                fullPrompt = `${fullPrompt}\n\n---\n\n## Feature Specification\n\n${feature.description}`;
              }

              setPrompt(fullPrompt);
              setContextPreview(contextResult.prompt || null);
              
              if (contextResult.warning) {
                setContextWarning(contextResult.warning);
              }
            } else {
              // Fallback to basic prompt if context fetch fails
              const fullPrompt = `${stepPrompt}\n\n---\n\n## Feature Specification\n\n${feature.description}`;
              setPrompt(fullPrompt);
            }
          } catch (err) {
            // Fallback to basic prompt if context fetch fails
            const fullPrompt = `${stepPrompt}\n\n---\n\n## Feature Specification\n\n${feature.description}`;
            setPrompt(fullPrompt);
          } finally {
            setContextLoading(false);
          }
        } else {
          setPrompt('');
        }
      }

      loadPrompt();
    }
  }, [isOpen, project, feature, workflowStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      
      if (onAgentLaunched) {
        onAgentLaunched(response, workflowStep?.id);
      }

      onClose();
    } catch (err) {
      let errorMessage = 'Failed to launch agent. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Launch Agent
            </h2>
            {feature && workflowStep && (
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{feature.title}</span>
                <span className="mx-2">•</span>
                <span>{getWorkflowStepLabel(workflowStep.stepType)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="repository" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Repository *
            </label>
            <div className="relative">
              <input
                id="repository"
                type="text"
                value={project.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <input
                type="hidden"
                value={repository}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Repository is set by the project
            </p>
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Branch Name
            </label>
            <input
              id="branch"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Leave blank for default branch"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Context Preview */}
          {feature && showContextPreview && contextPreview && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Context Preview
                </label>
                <button
                  type="button"
                  onClick={() => setShowContextPreview(!showContextPreview)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showContextPreview ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                {contextPreview}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This context will be included in the agent prompt
              </p>
            </div>
          )}

          {/* Shortcut Selector */}
          {shortcuts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Prompt *
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              rows={6}
              placeholder="Describe what you want the agent to do..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Auto">Auto</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          {contextLoading && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-blue-700 dark:text-blue-400 text-sm">
              Loading context...
            </div>
          )}

          {contextWarning && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-400 text-sm">
              {contextWarning}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Launching...' : 'Launch Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
