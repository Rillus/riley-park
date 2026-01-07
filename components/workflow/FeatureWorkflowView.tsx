'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkflowProgress from './WorkflowProgress';
import WorkflowStepCard from './WorkflowStepCard';
import { LaunchAgentModal } from '@/components/agent';
import { FeatureWithWorkflow, WorkflowStep } from '@/lib/features/types';
import { LaunchAgentResponse } from '@/lib/cursor-api';
import { updateWorkflowStep } from '@/lib/features/client';
import { WorkflowStepType } from '@/lib/agent-launch';

interface FeatureWorkflowViewProps {
  feature: FeatureWithWorkflow & { project: { id: string; name: string; repositoryUrl: string; defaultBranch: string } };
  onRefresh?: () => void;
}

export default function FeatureWorkflowView({
  feature,
  onRefresh,
}: FeatureWorkflowViewProps) {
  const router = useRouter();
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunchAgent = (step: WorkflowStep) => {
    setSelectedStep(step);
  };

  const handleAgentLaunched = async (agent: LaunchAgentResponse, workflowStepId?: string) => {
    if (workflowStepId) {
      try {
        // Update the workflow step with the agent ID and set status to in_progress
        await updateWorkflowStep(workflowStepId, { agentId: agent.id, status: 'in_progress' });
        onRefresh?.();
      } catch (err) {
        console.error('Failed to assign agent to step:', err);
        // Still navigate even if assignment fails
      }
    }
    
    setSelectedStep(null);
    // Navigate to the agent conversation
    router.push(`/agents/${agent.id}/conversation`);
  };

  const handleViewAgent = (agentId: string) => {
    router.push(`/agents/${agentId}/conversation`);
  };

  const handleMarkComplete = async (step: WorkflowStep) => {
    setLoading(true);
    setError(null);
    
    try {
      await updateWorkflowStep(step.id, { status: 'completed' });
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark step as complete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Workflow Progress
        </h2>
        <WorkflowProgress
          steps={feature.workflowSteps}
          onStepClick={handleLaunchAgent}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Workflow steps grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Workflow Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feature.workflowSteps.map((step) => (
            <WorkflowStepCard
              key={step.id}
              step={step}
              onLaunchAgent={handleLaunchAgent}
              onViewAgent={handleViewAgent}
              onMarkComplete={handleMarkComplete}
            />
          ))}
        </div>
      </div>

      {/* Launch Agent Modal */}
      {selectedStep && (
        <LaunchAgentModal
          isOpen={true}
          onClose={() => setSelectedStep(null)}
          onAgentLaunched={handleAgentLaunched}
          project={{
            id: feature.project.id,
            name: feature.project.name,
            repositoryUrl: feature.project.repositoryUrl,
            defaultBranch: feature.project.defaultBranch,
          }}
          feature={{
            id: feature.id,
            title: feature.title,
            description: feature.description,
          }}
          workflowStep={{
            id: selectedStep.id,
            stepType: selectedStep.stepType as WorkflowStepType,
          }}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <span className="text-gray-700 dark:text-gray-300">Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
}
