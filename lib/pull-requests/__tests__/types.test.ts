/**
 * Tests for Pull Request Types
 */

import {
  parseGitHubPRUrl,
  extractBranchName,
  PRStatus,
} from '../types';

describe('parseGitHubPRUrl', () => {
  it('should parse a standard GitHub PR URL', () => {
    const url = 'https://github.com/owner/repo/pull/123';
    const result = parseGitHubPRUrl(url);
    
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      prNumber: 123,
    });
  });

  it('should parse a GitHub PR URL with files path', () => {
    const url = 'https://github.com/owner/repo/pull/123/files';
    const result = parseGitHubPRUrl(url);
    
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      prNumber: 123,
    });
  });

  it('should parse a GitHub PR URL with query parameters', () => {
    const url = 'https://github.com/owner/repo/pull/123?tab=files';
    const result = parseGitHubPRUrl(url);
    
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      prNumber: 123,
    });
  });

  it('should return null for invalid URLs', () => {
    const url = 'https://github.com/owner/repo';
    const result = parseGitHubPRUrl(url);
    
    expect(result).toBeNull();
  });

  it('should return null for non-GitHub URLs', () => {
    const url = 'https://gitlab.com/owner/repo/merge_requests/123';
    const result = parseGitHubPRUrl(url);
    
    expect(result).toBeNull();
  });

  it('should handle URLs with port numbers', () => {
    const url = 'https://github.com:443/owner/repo/pull/456';
    const result = parseGitHubPRUrl(url);
    
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      prNumber: 456,
    });
  });
});

describe('extractBranchName', () => {
  it('should extract branch name from PR title', () => {
    const prTitle = 'Feature: Add new functionality (branch: feature/new-feature)';
    const result = extractBranchName('https://github.com/owner/repo/pull/123', prTitle);
    
    expect(result).toBe('feature/new-feature');
  });

  it('should extract branch name with colon separator', () => {
    const prTitle = 'PR Title branch: my-branch-name';
    const result = extractBranchName('https://github.com/owner/repo/pull/123', prTitle);
    
    expect(result).toBe('my-branch-name');
  });

  it('should return null if no branch name found', () => {
    const prTitle = 'Just a regular PR title';
    const result = extractBranchName('https://github.com/owner/repo/pull/123', prTitle);
    
    expect(result).toBeNull();
  });

  it('should return null if no PR title provided', () => {
    const result = extractBranchName('https://github.com/owner/repo/pull/123');
    
    expect(result).toBeNull();
  });
});

describe('PRStatus', () => {
  it('should have all required status values', () => {
    expect(PRStatus.DRAFT).toBe('draft');
    expect(PRStatus.OPEN).toBe('open');
    expect(PRStatus.MERGED).toBe('merged');
    expect(PRStatus.CLOSED).toBe('closed');
  });
});

