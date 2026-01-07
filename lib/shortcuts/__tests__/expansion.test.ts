/**
 * Tests for shortcut expansion service
 */

import { expandShortcut } from '../expansion';

describe('expandShortcut', () => {
  it('should expand single variable', () => {
    const template = 'Create a spec for {feature}';
    const variables = { feature: 'Test Feature' };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create a spec for Test Feature');
  });

  it('should expand multiple variables', () => {
    const template = 'Create {feature} in {project}';
    const variables = {
      feature: 'Test Feature',
      project: 'Test Project',
    };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create Test Feature in Test Project');
  });

  it('should expand all variable types', () => {
    const template = 'Create {feature} in {project} for {step} with {description}';
    const variables = {
      feature: 'Test Feature',
      project: 'Test Project',
      step: 'spec',
      description: 'Test description',
    };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create Test Feature in Test Project for spec with Test description');
  });

  it('should handle multiple occurrences of same variable', () => {
    const template = 'Create {feature} and test {feature}';
    const variables = { feature: 'Test Feature' };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create Test Feature and test Test Feature');
  });

  it('should handle missing variables gracefully', () => {
    const template = 'Create {feature} in {project}';
    const variables = { feature: 'Test Feature' };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create Test Feature in ');
  });

  it('should handle empty variables object', () => {
    const template = 'Create {feature} in {project}';
    const variables = {};
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create  in ');
  });

  it('should handle template without variables', () => {
    const template = 'This is a simple prompt without variables';
    const variables = { feature: 'Test Feature' };
    const result = expandShortcut(template, variables);
    expect(result).toBe('This is a simple prompt without variables');
  });

  it('should handle unknown variables gracefully', () => {
    const template = 'Create {feature} with {unknown} variable';
    const variables = { feature: 'Test Feature' };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create Test Feature with  variable');
  });

  it('should handle empty string values', () => {
    const template = 'Create {feature} in {project}';
    const variables = {
      feature: '',
      project: 'Test Project',
    };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create  in Test Project');
  });

  it('should handle special characters in variable values', () => {
    const template = 'Create {feature}';
    const variables = { feature: 'Feature with "quotes" and {braces}' };
    const result = expandShortcut(template, variables);
    expect(result).toBe('Create Feature with "quotes" and {braces}');
  });
});

