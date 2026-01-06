'use client';

import { useState } from 'react';
import { WorkflowStepData, WORKFLOW_STEP_LABELS, FeatureData } from '@/lib/workflow/types';
import { getAutoTransitionPrompt } from '@/lib/workflow/auto-transition';

interface WorkflowStepActionsProps {
  step: WorkflowStepData;
  feature: FeatureData;
  previousOutput?: string | null;
  canExecute: boolean;
  canRerun: boolean;
  canManualComplete: boolean;
  onLaunch?: (stepId: string, prompt: string) => Promise<void>;
  onComplete?: (stepId: string, output?: string) => Promise<void>;
  onBlock?: (stepId: string, reason?: string) => Promise<void>;
  onReset?: (stepId: string) => Promise<void>;
}

export default function WorkflowStepActions({
  step,
  feature,
  previousOutput,
  canExecute,
  canRerun,
  canManualComplete,
  onLaunch,
  onComplete,
  onBlock,
  onReset,
}: WorkflowStepActionsProps) {
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(false);

  const stepLabel = WORKFLOW_STEP_LABELS[step.stepType];

  const handleLaunch = async () => {
    if (!onLaunch) return;
    setLoading(true);
    try {
      await onLaunch(step.id, prompt);
      setIsLaunchModalOpen(false);
      setPrompt('');
    } catch (error) {
      console.error('Error launching agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setLoading(true);
    try {
      await onComplete(step.id, output || undefined);
      setIsCompleteModalOpen(false);
      setOutput('');
    } catch (error) {
      console.error('Error completing step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!onBlock) return;
    setLoading(true);
    try {
      await onBlock(step.id, blockReason || undefined);
      setIsBlockModalOpen(false);
      setBlockReason('');
    } catch (error) {
      console.error('Error blocking step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!onReset) return;
    setLoading(true);
    try {
      await onReset(step.id);
    } catch (error) {
      console.error('Error resetting step:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultPrompt = () => {
    const defaultPrompt = getAutoTransitionPrompt(
      feature,
      step.stepType,
      previousOutput || ''
    );
    setPrompt(defaultPrompt);
  };

  return (
    <div className="space-y-2">
      {/* Status-specific actions */}
      {step.status === 'pending' && canExecute && (
        <button
          onClick={() => {
            generateDefaultPrompt();
            setIsLaunchModalOpen(true);
          }}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Launch Agent
        </button>
      )}

      {step.status === 'in_progress' && step.agentId && (
        <div className="space-y-2">
          <a
            href={`/agents/${step.agentId}/conversation`}
            className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium text-center"
          >
            View Conversation
          </a>
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
          >
            Mark as Blocked
          </button>
        </div>
      )}

      {step.status === 'completed' && canRerun && (
        <button
          onClick={() => {
            generateDefaultPrompt();
            setIsLaunchModalOpen(true);
          }}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Re-run Step
        </button>
      )}

      {step.status === 'blocked' && (
        <div className="space-y-2">
          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Reset to Pending
          </button>
          <button
            onClick={() => {
              generateDefaultPrompt();
              setIsLaunchModalOpen(true);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Retry Step
          </button>
        </div>
      )}

      {/* Manual completion button */}
      {canManualComplete && step.status !== 'completed' && (
        <button
          onClick={() => setIsCompleteModalOpen(true)}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
        >
          Mark as Complete
        </button>
      )}

      {/* Launch Modal */}
      {isLaunchModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Launch Agent for {stepLabel}
              </h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter the prompt for the agent..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsLaunchModalOpen(false);
                  setPrompt('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunch}
                disabled={loading || !prompt.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {loading ? 'Launching...' : 'Launch Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete {stepLabel} Step
              </h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output (optional)
                </label>
                <textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter any output or notes for this step..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCompleteModalOpen(false);
                  setOutput('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {loading ? 'Completing...' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Block {stepLabel} Step
              </h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter the reason for blocking this step..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsBlockModalOpen(false);
                  setBlockReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm disabled:opacity-50"
              >
                {loading ? 'Blocking...' : 'Block Step'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
