/**
 * Cursor Cloud Agents API Client
 */

import {
  LaunchAgentRequest,
  LaunchAgentResponse,
  FollowupRequest,
  FollowupResponse,
  AgentStatusResponse,
  CursorAPIError,
} from './types';

// Use Next.js API routes as proxy to avoid CORS issues
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper to check if we're in the browser
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export class CursorAPIClient {
  private apiKey: string;
  private baseUrl: string;
  private useProxy: boolean;

  constructor(apiKey: string, baseUrl?: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    // Use proxy when running in browser, direct API when on server
    this.useProxy = isBrowser();
    // Always use proxy in browser to avoid CORS, use direct API only on server
    this.baseUrl = baseUrl || (this.useProxy ? '/api/cursor' : 'https://api.cursor.com/v0');
    
    // Debug logging
    if (this.useProxy && process.env.NODE_ENV === 'development') {
      console.log('CursorAPIClient: Using proxy mode, baseUrl:', this.baseUrl);
    }
  }

  /**
   * Get authentication header for Basic Auth
   */
  private getAuthHeader(): string {
    // Cursor API uses Basic Auth with empty username and API key as password
    const credentials = Buffer.from(`:${this.apiKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Make HTTP request with retry logic
   * Uses proxy API routes when in browser to avoid CORS issues
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES
  ): Promise<Response> {
    try {
      // Add API key to headers when using proxy
      const existingHeaders = options.headers as Record<string, string> || {};
      const headers: Record<string, string> = { ...existingHeaders };
      
      if (this.useProxy) {
        // For proxy mode, we'll use body instead of headers (more reliable)
        // Headers can be blocked by CORS or Next.js
        if (options.body && typeof options.body === 'string') {
          try {
            const bodyObj = JSON.parse(options.body);
            // Only add apiKey if it's not already there
            if (!bodyObj.apiKey) {
              bodyObj.apiKey = this.apiKey;
            }
            options.body = JSON.stringify(bodyObj);
            // Debug: log that we're using proxy (remove in production)
            if (process.env.NODE_ENV === 'development') {
              console.log('Using proxy, API key present:', !!this.apiKey);
              console.log('Sending API key in request body');
              console.log('Body keys:', Object.keys(bodyObj));
            }
          } catch (e) {
            // If body isn't JSON, this is an error - log it
            console.error('Failed to parse request body:', e);
            throw new Error('Invalid request body');
          }
        } else {
          // If no body, create one with just the API key
          options.body = JSON.stringify({ apiKey: this.apiKey });
        }
      } else {
        // Use Basic Auth when calling API directly (server-side)
        headers['Authorization'] = this.getAuthHeader();
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Include the full error response in the error message for better debugging
        const errorMessage = errorData.error || errorData.message || `API request failed with status ${response.status}`;
        const errorDetails = errorData.suggestion ? `${errorMessage}. ${errorData.suggestion}` : errorMessage;
        throw new CursorAPIError(
          JSON.stringify({ error: errorDetails, ...errorData }),
          response.status,
          errorData
        );
      }
      return response;
    } catch (error) {
      if (error instanceof CursorAPIError) {
        throw error;
      }
      
      // Retry on network errors
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      throw new CursorAPIError(
        error instanceof Error ? error.message : 'Network error',
        undefined,
        error
      );
    }
  }

  /**
   * Launch a new Cursor Cloud Agent
   */
  async launchAgent(request: LaunchAgentRequest): Promise<LaunchAgentResponse> {
    // Ensure we're using the proxy in browser
    const baseUrl = this.useProxy ? '/api/cursor' : this.baseUrl;
    const url = `${baseUrl}/agents`;
    
    if (this.useProxy && process.env.NODE_ENV === 'development') {
      console.log('Launching agent via proxy:', url);
    }
    
    // Cursor API expects a specific structure:
    // {
    //   "prompt": { "text": "...", "images": [] },
    //   "source": { "repository": "...", "ref": "..." },
    //   "target": { "autoCreatePr": true, "branchName": "...", "skipReviewerRequest": false },
    //   "model": "..."
    // }
    const body: Record<string, unknown> = {
      prompt: {
        text: request.prompt,
      },
      source: {
        repository: request.repository,
      },
    };

    // Add ref (branch) to source if provided
    if (request.branch) {
      (body.source as Record<string, unknown>).ref = request.branch;
    }

    // Add target configuration
    const target: Record<string, unknown> = {};
    if (request.autoCreatePR !== undefined) {
      target.autoCreatePr = request.autoCreatePR;
    }
    if (request.skipReviewerRequest !== undefined) {
      target.skipReviewerRequest = request.skipReviewerRequest;
    }
    if (request.branch) {
      target.branchName = request.branch;
    }
    if (Object.keys(target).length > 0) {
      body.target = target;
    }

    // Add model if provided (optional)
    if (request.model && request.model !== 'Auto') {
      body.model = request.model;
    }

    // Add API key to body when using proxy (as fallback if header doesn't work)
    if (this.useProxy) {
      body.apiKey = this.apiKey;
    }

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return response.json();
  }

  /**
   * Send a follow-up message to an existing agent
   */
  async sendFollowup(
    agentId: string,
    request: FollowupRequest
  ): Promise<FollowupResponse> {
    // Ensure we're using the proxy in browser
    const baseUrl = this.useProxy ? '/api/cursor' : this.baseUrl;
    const url = `${baseUrl}/agents/${agentId}/followup`;
    
    // Cursor API expects: { "prompt": { "text": "...", "images": [] } }
    const body: Record<string, unknown> = {
      prompt: {
        text: request.message,
      },
    };

    if (request.images && request.images.length > 0) {
      (body.prompt as Record<string, unknown>).images = request.images;
    }

    // Add API key to body when using proxy
    if (this.useProxy) {
      body.apiKey = this.apiKey;
    }

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return response.json();
  }

  /**
   * Get the status of an agent
   */
  async getAgentStatus(agentId: string): Promise<AgentStatusResponse> {
    // Ensure we're using the proxy in browser
    const baseUrl = this.useProxy ? '/api/cursor' : this.baseUrl;
    const url = `${baseUrl}/agents/${agentId}`;

    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: {},
    });

    return response.json();
  }
}

