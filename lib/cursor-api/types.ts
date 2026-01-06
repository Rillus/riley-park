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

export interface ListAgentsResponse {
  agents: Array<{
    id: string;
    name?: string;
    status: AgentStatus;
    source?: {
      repository: string;
      ref?: string;
    };
    target?: {
      branchName?: string;
      url?: string;
      prUrl?: string;
      autoCreatePr?: boolean;
      openAsCursorGithubApp?: boolean;
      skipReviewerRequest?: boolean;
    };
    summary?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  nextCursor?: string;
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

/**
 * Conversation types for Agent Conversation View
 */

export type MessageRole = 'user' | 'assistant';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  images?: string[]; // Base64 encoded images or URLs
}

export interface ConversationResponse {
  agentId: string;
  messages: ConversationMessage[];
  hasMore?: boolean;
  nextCursor?: string;
}

