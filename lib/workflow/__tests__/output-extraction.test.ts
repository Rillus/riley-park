/**
 * Tests for Output Extraction Logic
 */

import {
  extractStepOutput,
  extractSpecificationOutput,
  extractDesignOutput,
  extractImplementationOutput,
  extractReviewOutput,
  extractTestOutput,
  extractSubmitOutput,
  findPRUrl,
  findDocumentSection,
} from '../output-extraction';
import { ConversationMessage } from '@/lib/cursor-api/types';

describe('Output Extraction', () => {
  describe('extractSpecificationOutput', () => {
    it('should extract specification document from conversation', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Create a specification for user authentication',
          timestamp: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: `# Specification: User Authentication

## Overview
This document specifies the user authentication feature.

## Requirements
1. Users can sign in with email/password
2. Password must be at least 8 characters
3. Support OAuth providers

## Acceptance Criteria
- User can log in successfully
- Invalid credentials show error message`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractSpecificationOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('User Authentication');
      expect(result.output).toContain('Requirements');
      expect(result.metadata?.documentTitle).toBe('Specification: User Authentication');
    });

    it('should handle conversation without specification document', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there! How can I help you?',
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractSpecificationOutput(messages);

      expect(result.success).toBe(false);
      expect(result.output).toBeNull();
    });

    it('should extract specification with Feature keyword', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `# Feature Specification

## Feature: Shopping Cart
Users should be able to add items to cart.`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractSpecificationOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Shopping Cart');
    });
  });

  describe('extractDesignOutput', () => {
    it('should extract design document from conversation', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Design the authentication system',
          timestamp: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: `# Design Document: Authentication System

## Architecture
The system uses JWT tokens for session management.

## Components
1. AuthService - handles login/logout
2. TokenManager - manages JWT tokens
3. UserRepository - user data access

## Database Schema
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE
);
\`\`\``,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractDesignOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Architecture');
      expect(result.output).toContain('Components');
      expect(result.metadata?.documentTitle).toBe('Design Document: Authentication System');
    });

    it('should handle technical design format', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `## Technical Design

### API Endpoints
- POST /api/auth/login
- POST /api/auth/logout

### Data Flow
User → AuthController → AuthService → Database`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractDesignOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('API Endpoints');
    });
  });

  describe('extractImplementationOutput', () => {
    it('should detect PR creation in conversation', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `I've implemented the authentication feature.

Created PR: https://github.com/owner/repo/pull/123

The implementation includes:
- Login endpoint
- Logout endpoint
- JWT token generation`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractImplementationOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('implementation');
      expect(result.metadata?.prUrl).toBe('https://github.com/owner/repo/pull/123');
    });

    it('should handle PR URL variants', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `Implementation complete. Pull request available at:
https://github.com/myorg/myrepo/pull/456`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractImplementationOutput(messages);

      expect(result.success).toBe(true);
      expect(result.metadata?.prUrl).toBe('https://github.com/myorg/myrepo/pull/456');
    });

    it('should extract implementation summary without PR', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `I've completed the implementation:

1. Created AuthService class
2. Added JWT middleware
3. Updated database schema
4. Added unit tests

All tests are passing.`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractImplementationOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('implementation');
      expect(result.metadata?.prUrl).toBeUndefined();
    });
  });

  describe('extractReviewOutput', () => {
    it('should extract review comments from conversation', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `# Code Review

## Summary
Overall the implementation looks good.

## Issues Found
1. Missing error handling in AuthService.login()
2. SQL injection vulnerability in UserRepository
3. Password validation could be stronger

## Suggestions
- Add input sanitisation
- Use parameterised queries
- Consider rate limiting

## Verdict
Request changes needed before approval.`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractReviewOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Code Review');
      expect(result.metadata?.reviewComments).toContain('Missing error handling in AuthService.login()');
      expect(result.metadata?.reviewComments).toContain('SQL injection vulnerability in UserRepository');
    });

    it('should handle approval without issues', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `# Review Complete

The code looks excellent. No issues found.

Approved! ✅`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractReviewOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Approved');
    });
  });

  describe('extractTestOutput', () => {
    it('should extract test completion summary', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `# Test Results

All tests passed! ✅

## Summary
- Total tests: 45
- Passed: 45
- Failed: 0
- Coverage: 87%

## Test Suites
- AuthService: 15 tests passed
- TokenManager: 12 tests passed
- UserRepository: 18 tests passed`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractTestOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Test Results');
      expect(result.output).toContain('passed');
    });

    it('should handle test failures', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `Tests completed with failures:

- Passed: 40
- Failed: 5

Failed tests:
1. AuthService.login should reject invalid credentials
2. TokenManager.verify should handle expired tokens`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractTestOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('failures');
    });
  });

  describe('extractSubmitOutput', () => {
    it('should detect PR finalisation', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `PR has been finalised and is ready for merge.

PR URL: https://github.com/owner/repo/pull/123

Status:
- All checks passed ✅
- Approved by reviewers ✅
- No merge conflicts ✅`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractSubmitOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('finalised');
      expect(result.metadata?.prUrl).toBe('https://github.com/owner/repo/pull/123');
    });

    it('should handle PR merge', () => {
      const messages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: `The pull request has been merged successfully!

https://github.com/owner/repo/pull/123 merged into main.`,
          timestamp: '2025-01-01T00:01:00Z',
        },
      ];

      const result = extractSubmitOutput(messages);

      expect(result.success).toBe(true);
      expect(result.output).toContain('merged');
    });
  });

  describe('extractStepOutput', () => {
    const messages: ConversationMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: `# Specification: Test Feature

## Overview
Test specification content.`,
        timestamp: '2025-01-01T00:00:00Z',
      },
    ];

    it('should route to correct extractor for spec step', () => {
      const result = extractStepOutput('spec', messages);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Test Feature');
    });

    it('should route to correct extractor for design step', () => {
      const designMessages: ConversationMessage[] = [
        {
          id: '1',
          role: 'assistant',
          content: '# Technical Design\n\n## Architecture\nMicroservices',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ];
      const result = extractStepOutput('design', designMessages);
      expect(result.success).toBe(true);
    });

    it('should handle invalid step type', () => {
      const result = extractStepOutput('invalid' as never, messages);
      expect(result.success).toBe(false);
    });
  });

  describe('findPRUrl', () => {
    it('should find GitHub PR URLs', () => {
      const content = 'Check out https://github.com/owner/repo/pull/123 for details';
      expect(findPRUrl(content)).toBe('https://github.com/owner/repo/pull/123');
    });

    it('should find PR URL with trailing text', () => {
      const content = 'PR: https://github.com/owner/repo/pull/456.';
      expect(findPRUrl(content)).toBe('https://github.com/owner/repo/pull/456');
    });

    it('should return null when no PR URL found', () => {
      const content = 'No PR here';
      expect(findPRUrl(content)).toBeNull();
    });
  });

  describe('findDocumentSection', () => {
    it('should find markdown document section', () => {
      const content = `Some intro text.

# Main Document

## Section 1
Content here.

## Section 2
More content.`;

      const section = findDocumentSection(content, ['# Main Document', '# Document']);
      expect(section).toContain('Main Document');
      expect(section).toContain('Section 1');
    });

    it('should return null when section not found', () => {
      const content = 'Just some text without headers';
      const section = findDocumentSection(content, ['# Missing']);
      expect(section).toBeNull();
    });
  });
});
