/**
 * Tests for PR Detection Service
 */

import {
  detectPRsInConversation,
  extractPRInfoFromMessage,
} from '../detection';
import { ConversationMessage } from '@/lib/cursor-api/types';

describe('extractPRInfoFromMessage', () => {
  it('should extract PR info from a message with GitHub PR URL', () => {
    const message: ConversationMessage = {
      id: '1',
      role: 'assistant',
      content: 'I\'ve created a PR: https://github.com/owner/repo/pull/123',
      timestamp: new Date().toISOString(),
    };

    const result = extractPRInfoFromMessage(message);
    
    expect(result).toEqual({
      prUrl: 'https://github.com/owner/repo/pull/123',
      prNumber: 123,
      prTitle: null,
      branchName: null,
    });
  });

  it('should extract PR info with title in message', () => {
    const message: ConversationMessage = {
      id: '1',
      role: 'assistant',
      content: 'Created PR: https://github.com/owner/repo/pull/456\nTitle: Feature: Add new functionality',
      timestamp: new Date().toISOString(),
    };

    const result = extractPRInfoFromMessage(message);
    
    expect(result).toEqual({
      prUrl: 'https://github.com/owner/repo/pull/456',
      prNumber: 456,
      prTitle: 'Feature: Add new functionality',
      branchName: null,
    });
  });

  it('should extract PR info with branch name', () => {
    const message: ConversationMessage = {
      id: '1',
      role: 'assistant',
      content: 'PR created: https://github.com/owner/repo/pull/789\nBranch: feature/new-feature',
      timestamp: new Date().toISOString(),
    };

    const result = extractPRInfoFromMessage(message);
    
    expect(result).toEqual({
      prUrl: 'https://github.com/owner/repo/pull/789',
      prNumber: 789,
      prTitle: null,
      branchName: 'feature/new-feature',
    });
  });

  it('should return null if no PR URL found', () => {
    const message: ConversationMessage = {
      id: '1',
      role: 'assistant',
      content: 'I\'ve completed the implementation.',
      timestamp: new Date().toISOString(),
    };

    const result = extractPRInfoFromMessage(message);
    
    expect(result).toBeNull();
  });

  it('should handle multiple PR URLs and return the first one', () => {
    const message: ConversationMessage = {
      id: '1',
      role: 'assistant',
      content: 'PR 1: https://github.com/owner/repo/pull/111\nPR 2: https://github.com/owner/repo/pull/222',
      timestamp: new Date().toISOString(),
    };

    const result = extractPRInfoFromMessage(message);
    
    expect(result).toEqual({
      prUrl: 'https://github.com/owner/repo/pull/111',
      prNumber: 111,
      prTitle: null,
      branchName: null,
    });
  });
});

describe('detectPRsInConversation', () => {
  it('should detect PRs in conversation messages', () => {
    const messages: ConversationMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Please implement feature X',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'I\'ve created a PR: https://github.com/owner/repo/pull/123',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = detectPRsInConversation(messages);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      prUrl: 'https://github.com/owner/repo/pull/123',
      prNumber: 123,
      prTitle: null,
      branchName: null,
    });
  });

  it('should detect multiple PRs in conversation', () => {
    const messages: ConversationMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'PR 1: https://github.com/owner/repo/pull/111',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'PR 2: https://github.com/owner/repo/pull/222',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = detectPRsInConversation(messages);
    
    expect(result).toHaveLength(2);
    expect(result[0].prNumber).toBe(111);
    expect(result[1].prNumber).toBe(222);
  });

  it('should return empty array if no PRs found', () => {
    const messages: ConversationMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'I\'ve completed the implementation.',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = detectPRsInConversation(messages);
    
    expect(result).toHaveLength(0);
  });

  it('should only check assistant messages', () => {
    const messages: ConversationMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Check this PR: https://github.com/owner/repo/pull/999',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'I\'ve created: https://github.com/owner/repo/pull/123',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = detectPRsInConversation(messages);
    
    // Should only detect PR from assistant message
    expect(result).toHaveLength(1);
    expect(result[0].prNumber).toBe(123);
  });
});

