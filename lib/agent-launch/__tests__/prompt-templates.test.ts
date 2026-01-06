/**
 * Tests for workflow step prompt templates
 */

import {
  WorkflowStepType,
  getPromptTemplate,
  generateStepPrompt,
  WORKFLOW_STEP_TYPES,
  getWorkflowStepLabel,
} from '../prompt-templates';

describe('WORKFLOW_STEP_TYPES', () => {
  it('should have all workflow step types', () => {
    expect(WORKFLOW_STEP_TYPES).toContain('spec');
    expect(WORKFLOW_STEP_TYPES).toContain('design');
    expect(WORKFLOW_STEP_TYPES).toContain('implement');
    expect(WORKFLOW_STEP_TYPES).toContain('review');
    expect(WORKFLOW_STEP_TYPES).toContain('test');
    expect(WORKFLOW_STEP_TYPES).toContain('submit');
  });

  it('should have exactly 6 step types', () => {
    expect(WORKFLOW_STEP_TYPES).toHaveLength(6);
  });
});

describe('getWorkflowStepLabel', () => {
  it('should return human-readable labels for each step type', () => {
    expect(getWorkflowStepLabel('spec')).toBe('Specification');
    expect(getWorkflowStepLabel('design')).toBe('Design');
    expect(getWorkflowStepLabel('implement')).toBe('Implementation');
    expect(getWorkflowStepLabel('review')).toBe('Review');
    expect(getWorkflowStepLabel('test')).toBe('Testing');
    expect(getWorkflowStepLabel('submit')).toBe('Submit');
  });

  it('should return the input for unknown step types', () => {
    expect(getWorkflowStepLabel('unknown' as WorkflowStepType)).toBe('unknown');
  });
});

describe('getPromptTemplate', () => {
  it('should return a template for specification step', () => {
    const template = getPromptTemplate('spec');
    expect(template).toContain('{feature_name}');
    expect(template).toContain('{feature_description}');
    expect(template.toLowerCase()).toContain('specification');
  });

  it('should return a template for design step', () => {
    const template = getPromptTemplate('design');
    expect(template).toContain('{feature_name}');
    expect(template.toLowerCase()).toContain('design');
  });

  it('should return a template for implementation step', () => {
    const template = getPromptTemplate('implement');
    expect(template).toContain('{feature_name}');
    expect(template.toLowerCase()).toContain('implement');
  });

  it('should return a template for review step', () => {
    const template = getPromptTemplate('review');
    expect(template).toContain('{feature_name}');
    expect(template.toLowerCase()).toContain('review');
  });

  it('should return a template for testing step', () => {
    const template = getPromptTemplate('test');
    expect(template).toContain('{feature_name}');
    expect(template.toLowerCase()).toContain('test');
  });

  it('should return a template for submit step', () => {
    const template = getPromptTemplate('submit');
    expect(template).toContain('{feature_name}');
    expect(template.toLowerCase()).toContain('pr');
  });

  it('should return a generic template for unknown step types', () => {
    const template = getPromptTemplate('unknown' as WorkflowStepType);
    expect(template).toContain('{feature_name}');
  });
});

describe('generateStepPrompt', () => {
  it('should replace feature_name placeholder', () => {
    const prompt = generateStepPrompt('spec', {
      featureName: 'User Authentication',
      featureDescription: 'Allow users to log in',
    });
    expect(prompt).toContain('User Authentication');
    expect(prompt).not.toContain('{feature_name}');
  });

  it('should replace feature_description placeholder', () => {
    const prompt = generateStepPrompt('spec', {
      featureName: 'User Authentication',
      featureDescription: 'Allow users to log in with email and password',
    });
    expect(prompt).toContain('Allow users to log in with email and password');
    expect(prompt).not.toContain('{feature_description}');
  });

  it('should generate correct prompt for spec step', () => {
    const prompt = generateStepPrompt('spec', {
      featureName: 'Dark Mode',
      featureDescription: 'Add dark mode toggle to settings',
    });
    expect(prompt.toLowerCase()).toContain('specification');
    expect(prompt).toContain('Dark Mode');
  });

  it('should generate correct prompt for design step', () => {
    const prompt = generateStepPrompt('design', {
      featureName: 'User Profile',
      featureDescription: 'User profile page',
    });
    expect(prompt.toLowerCase()).toContain('design');
    expect(prompt).toContain('User Profile');
  });

  it('should generate correct prompt for implement step', () => {
    const prompt = generateStepPrompt('implement', {
      featureName: 'Shopping Cart',
      featureDescription: 'E-commerce cart feature',
    });
    expect(prompt.toLowerCase()).toContain('implement');
    expect(prompt).toContain('Shopping Cart');
  });

  it('should generate correct prompt for review step', () => {
    const prompt = generateStepPrompt('review', {
      featureName: 'Search Feature',
      featureDescription: 'Search functionality',
    });
    expect(prompt.toLowerCase()).toContain('review');
    expect(prompt).toContain('Search Feature');
  });

  it('should generate correct prompt for test step', () => {
    const prompt = generateStepPrompt('test', {
      featureName: 'API Gateway',
      featureDescription: 'API gateway implementation',
    });
    expect(prompt.toLowerCase()).toContain('test');
    expect(prompt).toContain('API Gateway');
  });

  it('should generate correct prompt for submit step', () => {
    const prompt = generateStepPrompt('submit', {
      featureName: 'Login Flow',
      featureDescription: 'User login flow',
    });
    expect(prompt.toLowerCase()).toContain('pr');
    expect(prompt).toContain('Login Flow');
  });

  it('should handle empty feature description', () => {
    const prompt = generateStepPrompt('spec', {
      featureName: 'Test Feature',
      featureDescription: '',
    });
    expect(prompt).toContain('Test Feature');
    expect(prompt).not.toContain('{feature_description}');
  });
});
