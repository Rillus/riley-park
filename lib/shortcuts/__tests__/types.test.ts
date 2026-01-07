/**
 * Tests for Shortcut types and validation schemas
 */

import {
  createShortcutSchema,
  updateShortcutSchema,
  expandShortcutSchema,
  extractVariables,
  SHORTCUT_VARIABLES,
  PREDEFINED_SHORTCUTS,
} from '../types';

describe('createShortcutSchema', () => {
  it('should validate a valid shortcut input', () => {
    const validInput = {
      name: 'Test Shortcut',
      promptTemplate: 'This is a test prompt with {feature}',
      category: 'Testing',
    };

    const result = createShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Shortcut');
      expect(result.data.promptTemplate).toBe('This is a test prompt with {feature}');
      expect(result.data.category).toBe('Testing');
    }
  });

  it('should validate a shortcut without category', () => {
    const validInput = {
      name: 'Test Shortcut',
      promptTemplate: 'This is a test prompt',
    };

    const result = createShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBeUndefined();
    }
  });

  it('should validate a shortcut with null category', () => {
    const validInput = {
      name: 'Test Shortcut',
      promptTemplate: 'This is a test prompt',
      category: null,
    };

    const result = createShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const invalidInput = {
      name: '',
      promptTemplate: 'This is a test prompt',
    };

    const result = createShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('should reject missing name', () => {
    const invalidInput = {
      promptTemplate: 'This is a test prompt',
    };

    const result = createShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty prompt template', () => {
    const invalidInput = {
      name: 'Test Shortcut',
      promptTemplate: '',
    };

    const result = createShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Prompt template is required');
    }
  });

  it('should reject missing prompt template', () => {
    const invalidInput = {
      name: 'Test Shortcut',
    };

    const result = createShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject name that is too long', () => {
    const invalidInput = {
      name: 'a'.repeat(256),
      promptTemplate: 'This is a test prompt',
    };

    const result = createShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is too long');
    }
  });

  it('should reject prompt template that is too long', () => {
    const invalidInput = {
      name: 'Test Shortcut',
      promptTemplate: 'a'.repeat(10001),
    };

    const result = createShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Prompt template is too long');
    }
  });

  it('should reject category that is too long', () => {
    const invalidInput = {
      name: 'Test Shortcut',
      promptTemplate: 'This is a test prompt',
      category: 'a'.repeat(101),
    };

    const result = createShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Category is too long');
    }
  });
});

describe('updateShortcutSchema', () => {
  it('should validate partial update with only name', () => {
    const validInput = {
      name: 'Updated Shortcut Name',
    };

    const result = updateShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate partial update with only prompt template', () => {
    const validInput = {
      promptTemplate: 'Updated prompt template',
    };

    const result = updateShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate partial update with only category', () => {
    const validInput = {
      category: 'Updated Category',
    };

    const result = updateShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate empty object (no changes)', () => {
    const validInput = {};

    const result = updateShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate full update', () => {
    const validInput = {
      name: 'Updated Shortcut',
      promptTemplate: 'Updated prompt template',
      category: 'Updated Category',
    };

    const result = updateShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject empty name in update', () => {
    const invalidInput = {
      name: '',
    };

    const result = updateShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty prompt template in update', () => {
    const invalidInput = {
      promptTemplate: '',
    };

    const result = updateShortcutSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('expandShortcutSchema', () => {
  it('should validate with all variables', () => {
    const validInput = {
      feature: 'Test Feature',
      project: 'Test Project',
      step: 'spec',
      description: 'Test description',
    };

    const result = expandShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate with no variables', () => {
    const validInput = {};

    const result = expandShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate with partial variables', () => {
    const validInput = {
      feature: 'Test Feature',
      project: 'Test Project',
    };

    const result = expandShortcutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
});

describe('extractVariables', () => {
  it('should extract single variable', () => {
    const template = 'Create a spec for {feature}';
    const variables = extractVariables(template);
    expect(variables).toEqual(['feature']);
  });

  it('should extract multiple unique variables', () => {
    const template = 'Create a spec for {feature} in {project}';
    const variables = extractVariables(template);
    expect(variables).toEqual(['feature', 'project']);
  });

  it('should not duplicate variables', () => {
    const template = 'Create a spec for {feature} and test {feature}';
    const variables = extractVariables(template);
    expect(variables).toEqual(['feature']);
  });

  it('should extract all variable types', () => {
    const template = 'Create {feature} in {project} for {step} with {description}';
    const variables = extractVariables(template);
    expect(variables).toEqual(['feature', 'project', 'step', 'description']);
  });

  it('should return empty array for template without variables', () => {
    const template = 'This is a simple prompt without variables';
    const variables = extractVariables(template);
    expect(variables).toEqual([]);
  });

  it('should handle nested braces correctly', () => {
    const template = 'Create {feature} with {{nested}} content';
    const variables = extractVariables(template);
    expect(variables).toEqual(['feature', 'nested']);
  });
});

describe('SHORTCUT_VARIABLES', () => {
  it('should have all expected variable constants', () => {
    expect(SHORTCUT_VARIABLES.FEATURE).toBe('{feature}');
    expect(SHORTCUT_VARIABLES.PROJECT).toBe('{project}');
    expect(SHORTCUT_VARIABLES.STEP).toBe('{step}');
    expect(SHORTCUT_VARIABLES.DESCRIPTION).toBe('{description}');
  });
});

describe('PREDEFINED_SHORTCUTS', () => {
  it('should have 5 predefined shortcuts', () => {
    expect(PREDEFINED_SHORTCUTS.length).toBe(5);
  });

  it('should have Create Spec shortcut', () => {
    const createSpec = PREDEFINED_SHORTCUTS.find(s => s.name === 'Create Spec');
    expect(createSpec).toBeDefined();
    expect(createSpec?.category).toBe('Specification');
    expect(createSpec?.promptTemplate).toContain('{feature}');
  });

  it('should have Review PR shortcut', () => {
    const reviewPR = PREDEFINED_SHORTCUTS.find(s => s.name === 'Review PR');
    expect(reviewPR).toBeDefined();
    expect(reviewPR?.category).toBe('Review');
  });

  it('should have Add Tests shortcut', () => {
    const addTests = PREDEFINED_SHORTCUTS.find(s => s.name === 'Add Tests');
    expect(addTests).toBeDefined();
    expect(addTests?.category).toBe('Testing');
    expect(addTests?.promptTemplate).toContain('{feature}');
  });

  it('should have Refactor shortcut', () => {
    const refactor = PREDEFINED_SHORTCUTS.find(s => s.name === 'Refactor');
    expect(refactor).toBeDefined();
    expect(refactor?.category).toBe('Code Quality');
  });

  it('should have Documentation shortcut', () => {
    const documentation = PREDEFINED_SHORTCUTS.find(s => s.name === 'Documentation');
    expect(documentation).toBeDefined();
    expect(documentation?.category).toBe('Documentation');
    expect(documentation?.promptTemplate).toContain('{feature}');
  });
});

