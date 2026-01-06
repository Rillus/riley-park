/**
 * Tests for Project types and validation schemas
 */

import { createProjectSchema, updateProjectSchema } from '../types';

describe('createProjectSchema', () => {
  it('should validate a valid project input', () => {
    const validInput = {
      name: 'Test Project',
      repositoryUrl: 'https://github.com/user/repo',
      defaultBranch: 'main',
      description: 'A test project',
    };

    const result = createProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Project');
      expect(result.data.repositoryUrl).toBe('https://github.com/user/repo');
      expect(result.data.defaultBranch).toBe('main');
      expect(result.data.description).toBe('A test project');
    }
  });

  it('should validate a project with minimal required fields', () => {
    const validInput = {
      name: 'Test Project',
      repositoryUrl: 'https://github.com/user/repo',
    };

    const result = createProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultBranch).toBe('main'); // Default value
    }
  });

  it('should reject empty project name', () => {
    const invalidInput = {
      name: '',
      repositoryUrl: 'https://github.com/user/repo',
    };

    const result = createProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Project name is required');
    }
  });

  it('should reject missing project name', () => {
    const invalidInput = {
      repositoryUrl: 'https://github.com/user/repo',
    };

    const result = createProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty repository URL', () => {
    const invalidInput = {
      name: 'Test Project',
      repositoryUrl: '',
    };

    const result = createProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid repository URL format', () => {
    const invalidInput = {
      name: 'Test Project',
      repositoryUrl: 'not-a-valid-url',
    };

    const result = createProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid repository URL format');
    }
  });

  it('should accept various valid repository URL formats', () => {
    const validUrls = [
      'https://github.com/user/repo',
      'https://github.com/user/repo.git',
      'https://gitlab.com/user/repo',
      'https://bitbucket.org/user/repo',
      'http://github.com/user/repo',
      'github.com/user/repo',
      'https://github.com/organization/nested/repo',
    ];

    for (const url of validUrls) {
      const result = createProjectSchema.safeParse({
        name: 'Test',
        repositoryUrl: url,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject description that is too long', () => {
    const invalidInput = {
      name: 'Test Project',
      repositoryUrl: 'https://github.com/user/repo',
      description: 'a'.repeat(2001),
    };

    const result = createProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description is too long');
    }
  });

  it('should reject project name that is too long', () => {
    const invalidInput = {
      name: 'a'.repeat(256),
      repositoryUrl: 'https://github.com/user/repo',
    };

    const result = createProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Project name is too long');
    }
  });
});

describe('updateProjectSchema', () => {
  it('should validate partial update with only name', () => {
    const validInput = {
      name: 'Updated Project Name',
    };

    const result = updateProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate partial update with only description', () => {
    const validInput = {
      description: 'Updated description',
    };

    const result = updateProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should allow null description to clear it', () => {
    const validInput = {
      description: null,
    };

    const result = updateProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate empty object (no changes)', () => {
    const validInput = {};

    const result = updateProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid repository URL in update', () => {
    const invalidInput = {
      repositoryUrl: 'not-valid',
    };

    const result = updateProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate full update', () => {
    const validInput = {
      name: 'Updated Project',
      repositoryUrl: 'https://github.com/new/repo',
      defaultBranch: 'develop',
      description: 'Updated description',
    };

    const result = updateProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
});
