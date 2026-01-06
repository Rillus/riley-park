/**
 * Tests for Cursor API Client
 */

import { CursorAPIClient } from '../client';
import { CursorAPIError } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('CursorAPIClient', () => {
  const apiKey = 'test-api-key';
  let client: CursorAPIClient;

  beforeEach(() => {
    client = new CursorAPIClient(apiKey);
    (fetch as jest.Mock).mockClear();
  });

  describe('constructor', () => {
    it('should create client with API key', () => {
      expect(client).toBeInstanceOf(CursorAPIClient);
    });

    it('should throw error if API key is missing', () => {
      expect(() => new CursorAPIClient('')).toThrow('API key is required');
    });
  });

  describe('launchAgent', () => {
    const mockRequest = {
      repository: 'https://github.com/user/repo',
      branch: 'main',
      prompt: 'Test prompt',
      model: 'Auto',
    };

    it('should successfully launch an agent', async () => {
      const mockResponse = {
        id: 'agent-123',
        status: 'RUNNING',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.launchAgent(mockRequest);

      expect(result).toEqual(mockResponse);
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      // In browser/Jest jsdom environment, uses proxy; in Node, uses direct API
      const isProxy = fetchCall[0].startsWith('/api/cursor');
      expect(isProxy || fetchCall[0] === 'https://api.cursor.com/v0/agents').toBe(true);
      expect(fetchCall[1].method).toBe('POST');
      if (isProxy) {
        expect(fetchCall[1].headers['x-api-key']).toBe(apiKey);
      } else {
        expect(fetchCall[1].headers['Authorization']).toBe(`Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`);
      }
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.repository).toBe(mockRequest.repository);
      expect(body.target.branchName).toBe(mockRequest.branch);
      expect(body.prompt).toBe(mockRequest.prompt);
      expect(body.model).toBe(mockRequest.model);
      expect(body.autoCreatePR).toBe(true);
      expect(body.skipReviewerRequest).toBe(false);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      });

      await expect(client.launchAgent(mockRequest)).rejects.toThrow(CursorAPIError);
    });

    it('should retry on network errors', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'agent-123', status: 'RUNNING' }),
        });

      const result = await client.launchAgent(mockRequest);
      expect(result.id).toBe('agent-123');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should use default values for optional parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'agent-123', status: 'RUNNING' }),
      });

      await client.launchAgent({
        repository: 'https://github.com/user/repo',
        prompt: 'Test prompt',
      });

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.repository).toBe('https://github.com/user/repo');
      expect(body.prompt).toBe('Test prompt');
      expect(body.model).toBe('Auto');
      expect(body.autoCreatePR).toBe(true);
      expect(body.skipReviewerRequest).toBe(false);
      expect(body.target).toBeUndefined();
    });
  });

  describe('sendFollowup', () => {
    const agentId = 'agent-123';
    const mockRequest = {
      message: 'Follow-up message',
      images: ['data:image/png;base64,test'],
    };

    it('should successfully send follow-up message', async () => {
      const mockResponse = {
        success: true,
        message: 'Message sent',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.sendFollowup(agentId, mockRequest);

      expect(result).toEqual(mockResponse);
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const isProxy = fetchCall[0].startsWith('/api/cursor');
      expect(isProxy || fetchCall[0] === `https://api.cursor.com/v0/agents/${agentId}/followup`).toBe(true);
      expect(fetchCall[1].method).toBe('POST');
      if (isProxy) {
        expect(fetchCall[1].headers['x-api-key']).toBe(apiKey);
      } else {
        expect(fetchCall[1].headers['Authorization']).toBe(`Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`);
      }
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.message).toBe(mockRequest.message);
      expect(body.images).toEqual(mockRequest.images);
    });

    it('should send follow-up without images', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.sendFollowup(agentId, { message: 'Test message' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Test message',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Agent not found' }),
      });

      await expect(
        client.sendFollowup(agentId, { message: 'Test' })
      ).rejects.toThrow(CursorAPIError);
    });
  });

  describe('getAgentStatus', () => {
    const agentId = 'agent-123';

    it('should successfully get agent status', async () => {
      const mockResponse = {
        id: agentId,
        status: 'RUNNING',
        repository: 'https://github.com/user/repo',
        branch: 'main',
        createdAt: '2025-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getAgentStatus(agentId);

      expect(result).toEqual(mockResponse);
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const isProxy = fetchCall[0].startsWith('/api/cursor');
      expect(isProxy || fetchCall[0] === `https://api.cursor.com/v0/agents/${agentId}`).toBe(true);
      expect(fetchCall[1].method).toBe('GET');
      if (isProxy) {
        expect(fetchCall[1].headers['x-api-key']).toBe(apiKey);
      } else {
        expect(fetchCall[1].headers['Authorization']).toBe(`Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`);
      }
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Agent not found' }),
      });

      await expect(client.getAgentStatus(agentId)).rejects.toThrow(CursorAPIError);
    });

    it('should retry on network errors', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: agentId, status: 'FINISHED' }),
        });

      const result = await client.getAgentStatus(agentId);
      expect(result.status).toBe('FINISHED');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getConversation', () => {
    const agentId = 'agent-123';

    it('should successfully get agent conversation', async () => {
      const mockResponse = {
        agentId,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Implement feature X',
            timestamp: '2025-01-01T00:00:00Z',
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'I will implement feature X. Here is my plan...',
            timestamp: '2025-01-01T00:00:01Z',
          },
        ],
        hasMore: false,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getConversation(agentId);

      expect(result).toEqual(mockResponse);
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const isProxy = fetchCall[0].startsWith('/api/cursor');
      expect(isProxy || fetchCall[0] === `https://api.cursor.com/v0/agents/${agentId}/conversation`).toBe(true);
      expect(fetchCall[1].method).toBe('GET');
    });

    it('should handle conversation with images', async () => {
      const mockResponse = {
        agentId,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Look at this screenshot',
            timestamp: '2025-01-01T00:00:00Z',
            images: ['data:image/png;base64,test'],
          },
        ],
        hasMore: false,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getConversation(agentId);

      expect(result.messages[0].images).toEqual(['data:image/png;base64,test']);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Agent not found' }),
      });

      await expect(client.getConversation(agentId)).rejects.toThrow(CursorAPIError);
    });

    it('should handle pagination cursor', async () => {
      const mockResponse = {
        agentId,
        messages: [],
        hasMore: true,
        nextCursor: 'cursor-abc',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getConversation(agentId);

      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cursor-abc');
    });

    it('should retry on network errors', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ agentId, messages: [] }),
        });

      const result = await client.getConversation(agentId);
      expect(result.agentId).toBe(agentId);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});

