/**
 * Tests for branch name generation utility
 */

import { generateBranchName, slugify } from '../branch-name';

describe('slugify', () => {
  it('should convert a simple string to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace special characters with hyphens', () => {
    expect(slugify('Feature: New Login')).toBe('feature-new-login');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('Multiple   Spaces   Here')).toBe('multiple-spaces-here');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(slugify('  Leading and trailing  ')).toBe('leading-and-trailing');
  });

  it('should handle parentheses and brackets', () => {
    expect(slugify('Feature (new) [test]')).toBe('feature-new-test');
  });

  it('should handle ampersands and plus signs', () => {
    expect(slugify('Login & Registration + Auth')).toBe('login-registration-auth');
  });

  it('should collapse multiple hyphens', () => {
    expect(slugify('Test---Multiple---Hyphens')).toBe('test-multiple-hyphens');
  });

  it('should handle numbers', () => {
    expect(slugify('Feature 123 Test')).toBe('feature-123-test');
  });

  it('should handle empty strings', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle strings with only special characters', () => {
    expect(slugify('!@#$%')).toBe('');
  });
});

describe('generateBranchName', () => {
  // Mock Date to get consistent timestamps
  const mockDate = new Date('2026-01-06T12:30:00.000Z');
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate branch name with cursor prefix', () => {
    const result = generateBranchName('Test Feature');
    expect(result).toMatch(/^cursor\//);
  });

  it('should include slugified feature name', () => {
    const result = generateBranchName('User Authentication');
    expect(result).toContain('user-authentication');
  });

  it('should include timestamp', () => {
    const result = generateBranchName('Test Feature');
    // Timestamp format: YYYYMMDD-HHmm
    expect(result).toContain('20260106-1230');
  });

  it('should generate correct format: cursor/{slug}-{timestamp}', () => {
    const result = generateBranchName('My Feature');
    expect(result).toBe('cursor/my-feature-20260106-1230');
  });

  it('should handle feature names with special characters', () => {
    const result = generateBranchName('Feature: Login & Registration!');
    expect(result).toBe('cursor/feature-login-registration-20260106-1230');
  });

  it('should accept optional custom prefix', () => {
    const result = generateBranchName('Test Feature', { prefix: 'feature' });
    expect(result).toBe('feature/test-feature-20260106-1230');
  });

  it('should accept optional timestamp override', () => {
    const customTimestamp = new Date('2025-12-25T08:00:00.000Z');
    const result = generateBranchName('Test Feature', { timestamp: customTimestamp });
    expect(result).toBe('cursor/test-feature-20251225-0800');
  });

  it('should truncate very long feature names', () => {
    const longName = 'This is a very long feature name that should be truncated to ensure the branch name does not exceed reasonable limits';
    const result = generateBranchName(longName);
    expect(result.length).toBeLessThanOrEqual(80);
    expect(result).toMatch(/^cursor\//);
  });

  it('should handle empty feature name gracefully', () => {
    const result = generateBranchName('');
    expect(result).toMatch(/^cursor\/feature-\d{8}-\d{4}$/);
  });
});
