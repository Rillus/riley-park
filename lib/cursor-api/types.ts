/**
 * Types for Cursor Cloud Agents API
 */

export type AgentStatus = 'RUNNING' | 'FINISHED' | 'STOPPED' | 'ERROR';

export interface Agent {
  id: string;
  status: AgentStatus;
  repository?: string;
  branch?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LaunchAgentRequest {
  repository: string;
  branch?: string;
  prompt: string;
  model?: string;
  autoCreatePR?: boolean;
  skipReviewerRequest?: boolean;
}

export interface LaunchAgentResponse {
  id: string;
  status: AgentStatus;
}

export interface FollowupRequest {
  message: string;
  images?: string[]; // Base64 encoded images or URLs
}

export interface FollowupResponse {
  success: boolean;
  message?: string;
}

export interface AgentStatusResponse {
  id: string;
  status: AgentStatus;
  repository?: string;
  branch?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class CursorAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'CursorAPIError';
  }
}

