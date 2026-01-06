/**
 * Tests for feature parser
 */

import { parseFeatureMetadata, readFeatureFiles, readFeatureFile } from '../parser';

// Mock fs
jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

import fs from 'fs';
import path from 'path';

const mockReaddirSync = fs.readdirSync as jest.MockedFunction<typeof fs.readdirSync>;
const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

describe('parseFeatureMetadata', () => {
  it('should parse feature metadata correctly', () => {
    const content = `# Feature 001: Basic Agent Messaging

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 1 day

## Overview
Test content`;

    const result = parseFeatureMetadata('001-basic-agent-messaging.md', content);

    expect(result.id).toBe('001-basic-agent-messaging');
    expect(result.title).toBe('Feature 001: Basic Agent Messaging');
    expect(result.priority).toBe('P0 (Must Have)');
    expect(result.status).toBe('✅ Completed');
    expect(result.estimatedTime).toBe('1 day');
    expect(result.filename).toBe('001-basic-agent-messaging.md');
    expect(result.content).toBe(content);
  });

  it('should handle missing metadata gracefully', () => {
    const content = `# Feature Test

## Overview
Test content`;

    const result = parseFeatureMetadata('test.md', content);

    expect(result.id).toBe('test');
    expect(result.title).toBe('Feature Test');
    expect(result.priority).toBeUndefined();
    expect(result.status).toBe('Not Started');
    expect(result.estimatedTime).toBeUndefined();
  });
});

describe('readFeatureFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read all feature files', () => {
    mockReaddirSync.mockReturnValue([
      '001-basic-agent-messaging.md',
      '002-agent-conversation-view.md',
      'README.md',
    ] as any);

    mockReadFileSync
      .mockReturnValueOnce('# Feature 001\n**Priority:** P0\n**Status:** Not Started')
      .mockReturnValueOnce('# Feature 002\n**Priority:** P1\n**Status:** In Progress');

    const features = readFeatureFiles();

    expect(features).toHaveLength(2);
    expect(features[0].id).toBe('001-basic-agent-messaging');
    expect(features[1].id).toBe('002-agent-conversation-view');
    expect(mockReaddirSync).toHaveBeenCalled();
  });

  it('should exclude README.md', () => {
    mockReaddirSync.mockReturnValue([
      '001-basic-agent-messaging.md',
      'README.md',
    ] as any);

    mockReadFileSync.mockReturnValueOnce('# Feature 001');

    const features = readFeatureFiles();

    expect(features).toHaveLength(1);
    expect(features[0].filename).not.toBe('README.md');
  });

  it('should handle errors gracefully', () => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error('File system error');
    });

    const features = readFeatureFiles();

    expect(features).toEqual([]);
  });
});

describe('readFeatureFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read a specific feature file by ID', () => {
    mockReaddirSync.mockReturnValue([
      '001-basic-agent-messaging.md',
      '002-agent-conversation-view.md',
    ] as any);

    mockReadFileSync.mockReturnValueOnce('# Feature 001\n**Priority:** P0');

    const feature = readFeatureFile('001-basic-agent-messaging');

    expect(feature).not.toBeNull();
    expect(feature?.id).toBe('001-basic-agent-messaging');
  });

  it('should return null if feature not found', () => {
    mockReaddirSync.mockReturnValue([
      '001-basic-agent-messaging.md',
    ] as any);

    const feature = readFeatureFile('999-nonexistent');

    expect(feature).toBeNull();
  });
});

