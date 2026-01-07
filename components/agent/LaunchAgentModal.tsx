'use client';

import { useState, useEffect } from 'react';
import { CursorAPIClient, LaunchAgentRequest, LaunchAgentResponse } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';
import { generateBranchName } from '@/lib/agent-launch/branch-name';
import { generateStepPrompt, getWorkflowStepLabel, WorkflowStepType } from '@/lib/agent-launch/prompt-templates';

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

  // Initialise form values when modal opens or context changes
  useEffect(() => {
    if (isOpen) {
      setRepository(project.repositoryUrl);
      setError(null);
      
      if (feature && workflowStep) {
        // Auto-generate branch name for feature workflow
        setBranch(generateBranchName(feature.title));
        // Pre-fill prompt with step-specific prompt and full feature description
        const stepPrompt = generateStepPrompt(workflowStep.stepType, {
          featureName: feature.title,
          featureDescription: feature.description,
        });
        // Include the full feature file content (markdown) in the prompt
        // The description field contains the full markdown content from the feature file
        const fullPrompt = `${stepPrompt}\n\n---\n\n## Feature Specification\n\n${feature.description}`;
        setPrompt(fullPrompt);
      } else {
        // Use project default branch
        setBranch(project.defaultBranch);
        setPrompt('');
      }
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
              Repository URL *
            </label>
            <input
              id="repository"
              type="url"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              required
              placeholder="https://github.com/user/repo"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
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
              placeholder="main"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {feature && workflowStep && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Auto-generated for feature workflow
              </p>
            )}
          </div>

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
