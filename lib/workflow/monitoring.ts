/**
 * Agent Status Monitoring Service
 * Polls agent status for workflow steps and triggers completion handlers
 */

import { prisma } from '@/lib/db';
import { CursorAPIClient, AgentStatus, AgentStatusResponse } from '@/lib/cursor-api';
import {
  WorkflowStepData,
  FeatureData,
  AgentStatusChangeEvent,
  StepCompletionResult,
  DEFAULT_POLLING_INTERVAL,
  MIN_POLLING_INTERVAL,
  MAX_POLLING_INTERVAL,
} from './types';
import { handleStepCompletion } from './completion-handler';

/**
 * Cache for agent statuses to detect changes
 */
export class AgentStatusCache {
  private cache: Map<string, AgentStatus> = new Map();

  set(agentId: string, status: AgentStatus): void {
    this.cache.set(agentId, status);
  }

  get(agentId: string): AgentStatus | undefined {
    return this.cache.get(agentId);
  }

  hasChanged(agentId: string, newStatus: AgentStatus): boolean {
    const previousStatus = this.cache.get(agentId);
    if (!previousStatus) {
      return true; // New agent, consider as changed
    }
    return previousStatus !== newStatus;
  }

  delete(agentId: string): void {
    this.cache.delete(agentId);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Event handlers for workflow monitoring
 */
type StatusChangeHandler = (event: AgentStatusChangeEvent) => void;
type StepCompletedHandler = (result: StepCompletionResult) => void;
type ErrorHandler = (error: Error, step?: WorkflowStepData) => void;

/**
 * Workflow Monitor class
 * Handles polling and event processing
 */
export class WorkflowMonitor {
  private client: CursorAPIClient;
  private pollingInterval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private statusCache: AgentStatusCache;
  private running: boolean = false;

  // Event handlers
  private statusChangeHandlers: StatusChangeHandler[] = [];
  private stepCompletedHandlers: StepCompletedHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  constructor(apiKey: string, pollingInterval: number = DEFAULT_POLLING_INTERVAL) {
    this.client = new CursorAPIClient(apiKey);
    this.pollingInterval = Math.min(
      Math.max(pollingInterval, MIN_POLLING_INTERVAL),
      MAX_POLLING_INTERVAL
    );
    this.statusCache = new AgentStatusCache();
  }

  /**
   * Start the monitoring loop
   */
  start(): void {
    if (this.running) {
      console.warn('WorkflowMonitor is already running');
      return;
    }

    this.running = true;
    console.log(`Starting workflow monitor with ${this.pollingInterval}ms interval`);

    // Initial poll
    this.poll();

    // Start interval
    this.intervalId = setInterval(() => {
      this.poll();
    }, this.pollingInterval);
  }

  /**
   * Stop the monitoring loop
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    console.log('Workflow monitor stopped');
  }

  /**
   * Check if monitor is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get current polling interval
   */
  getPollingInterval(): number {
    return this.pollingInterval;
  }

  /**
   * Update polling interval
   */
  setPollingInterval(interval: number): void {
    this.pollingInterval = Math.min(
      Math.max(interval, MIN_POLLING_INTERVAL),
      MAX_POLLING_INTERVAL
    );

    // Restart if running
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  /**
   * Register status change handler
   */
  onStatusChange(handler: StatusChangeHandler): void {
    this.statusChangeHandlers.push(handler);
  }

  /**
   * Register step completed handler
   */
  onStepCompleted(handler: StepCompletedHandler): void {
    this.stepCompletedHandlers.push(handler);
  }

  /**
   * Register error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Main polling function
   */
  private async poll(): Promise<void> {
    try {
      // Get all active workflow steps
      const activeSteps = await getActiveWorkflowSteps();

      if (activeSteps.length === 0) {
        return;
      }

      // Check each step's agent status
      for (const stepData of activeSteps) {
        try {
          const step = stepData as WorkflowStepData & { feature: FeatureData };
          const event = await checkAgentStatusChange(
            this.client,
            step,
            this.statusCache
          );

          if (event) {
            // Update cache
            this.statusCache.set(event.agentId, event.newStatus);

            // Notify handlers
            this.statusChangeHandlers.forEach((handler) => handler(event));

            // Process completion if agent finished/stopped/errored
            if (['FINISHED', 'STOPPED', 'ERROR'].includes(event.newStatus)) {
              const result = await processAgentCompletion(this.client, event);
              this.stepCompletedHandlers.forEach((handler) => handler(result));

              // Clean up cache for completed agents
              this.statusCache.delete(event.agentId);
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.errorHandlers.forEach((handler) => handler(err, stepData));
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.errorHandlers.forEach((handler) => handler(err));
    }
  }
}

/**
 * Get all workflow steps that are in progress with an agent assigned
 */
export async function getActiveWorkflowSteps(): Promise<
  (WorkflowStepData & { feature: FeatureData })[]
> {
  const steps = await prisma.workflowStep.findMany({
    where: {
      status: 'in_progress',
      agentId: { not: null },
    },
    include: {
      feature: true,
    },
  });

  return steps.map((step) => ({
    id: step.id,
    featureId: step.featureId,
    stepType: step.stepType as WorkflowStepData['stepType'],
    stepOrder: step.stepOrder,
    status: step.status as WorkflowStepData['status'],
    agentId: step.agentId,
    output: step.output,
    createdAt: step.createdAt,
    updatedAt: step.updatedAt,
    feature: {
      id: step.feature.id,
      projectId: step.feature.projectId,
      title: step.feature.title,
      description: step.feature.description,
      priority: step.feature.priority as FeatureData['priority'],
      status: step.feature.status as FeatureData['status'],
      createdAt: step.feature.createdAt,
      updatedAt: step.feature.updatedAt,
    },
  }));
}

/**
 * Check if agent status has changed
 */
export async function checkAgentStatusChange(
  client: CursorAPIClient,
  step: WorkflowStepData & { feature?: FeatureData },
  cache: AgentStatusCache
): Promise<AgentStatusChangeEvent | null> {
  if (!step.agentId) {
    return null;
  }

  try {
    const status = await client.getAgentStatus(step.agentId);
    const previousStatus = cache.get(step.agentId) || 'RUNNING';

    // Initialize cache if first time seeing this agent
    if (!cache.get(step.agentId)) {
      cache.set(step.agentId, status.status);
      // Don't trigger event on first poll unless status is terminal
      if (status.status === 'RUNNING') {
        return null;
      }
    }

    if (cache.hasChanged(step.agentId, status.status)) {
      return {
        agentId: step.agentId,
        previousStatus: previousStatus as AgentStatus,
        newStatus: status.status,
        workflowStep: step,
        feature: step.feature || ({
          id: step.featureId,
          projectId: '',
          title: '',
          description: '',
          priority: 'medium',
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to check agent status for ${step.agentId}:`, error);
    return null;
  }
}

/**
 * Process agent completion event
 */
export async function processAgentCompletion(
  client: CursorAPIClient,
  event: AgentStatusChangeEvent
): Promise<StepCompletionResult> {
  const { agentId, newStatus, workflowStep, feature } = event;

  try {
    // Get full feature with all workflow steps
    const fullFeature = await prisma.feature.findUnique({
      where: { id: feature.id },
      include: { workflowSteps: true },
    });

    if (!fullFeature) {
      return {
        success: false,
        stepId: workflowStep.id,
        output: null,
        nextStep: null,
        notification: null,
        error: 'Feature not found',
      };
    }

    const allSteps: WorkflowStepData[] = fullFeature.workflowSteps.map((s) => ({
      id: s.id,
      featureId: s.featureId,
      stepType: s.stepType as WorkflowStepData['stepType'],
      stepOrder: s.stepOrder,
      status: s.status as WorkflowStepData['status'],
      agentId: s.agentId,
      output: s.output,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    const featureData: FeatureData = {
      id: fullFeature.id,
      projectId: fullFeature.projectId,
      title: fullFeature.title,
      description: fullFeature.description,
      priority: fullFeature.priority as FeatureData['priority'],
      status: fullFeature.status as FeatureData['status'],
      createdAt: fullFeature.createdAt,
      updatedAt: fullFeature.updatedAt,
    };

    // Handle different terminal statuses
    switch (newStatus) {
      case 'FINISHED': {
        // Get conversation for output extraction
        let conversation = { agentId, messages: [] as any[] };
        try {
          conversation = await client.getConversation(agentId);
        } catch (error) {
          console.warn(`Failed to get conversation for agent ${agentId}:`, error);
        }

        return await handleStepCompletion({
          step: workflowStep,
          feature: featureData,
          allSteps,
          conversation: conversation.messages,
        });
      }

      case 'ERROR': {
        // Mark step as blocked
        await prisma.workflowStep.update({
          where: { id: workflowStep.id },
          data: {
            status: 'blocked',
            output: 'Agent encountered an error',
          },
        });

        // Create failure notification
        await prisma.notification.create({
          data: {
            type: 'step_failed',
            title: 'Step Failed',
            message: `The agent for "${workflowStep.stepType}" step encountered an error.`,
            featureId: feature.id,
            stepId: workflowStep.id,
            agentId,
            read: false,
            actionUrl: `/features/${feature.id}`,
            actionLabel: 'View Feature',
          },
        });

        return {
          success: true,
          stepId: workflowStep.id,
          output: 'Agent error',
          nextStep: null,
          notification: null,
          error: 'Agent encountered an error',
        };
      }

      case 'STOPPED': {
        // Reset step to pending
        await prisma.workflowStep.update({
          where: { id: workflowStep.id },
          data: {
            status: 'pending',
            agentId: null,
          },
        });

        return {
          success: true,
          stepId: workflowStep.id,
          output: null,
          nextStep: null,
          notification: null,
        };
      }

      default:
        return {
          success: false,
          stepId: workflowStep.id,
          output: null,
          nextStep: null,
          notification: null,
          error: `Unexpected agent status: ${newStatus}`,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      stepId: workflowStep.id,
      output: null,
      nextStep: null,
      notification: null,
      error: `Failed to process completion: ${errorMessage}`,
    };
  }
}

/**
 * Create a singleton monitor instance
 */
let monitorInstance: WorkflowMonitor | null = null;

export function getWorkflowMonitor(
  apiKey: string,
  pollingInterval?: number
): WorkflowMonitor {
  if (!monitorInstance) {
    monitorInstance = new WorkflowMonitor(apiKey, pollingInterval);
  }
  return monitorInstance;
}

export function destroyWorkflowMonitor(): void {
  if (monitorInstance) {
    monitorInstance.stop();
    monitorInstance = null;
  }
}
