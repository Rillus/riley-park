/**
 * Workflow step prompt templates for Cursor agents
 * 
 * Each workflow step type has a predefined prompt template
 * that can be customised with feature name and description.
 */

export const WORKFLOW_STEP_TYPES = [
  'spec',
  'design',
  'implement',
  'review',
  'test',
  'submit',
] as const;

export type WorkflowStepType = (typeof WORKFLOW_STEP_TYPES)[number];

/**
 * Human-readable labels for workflow step types
 */
const STEP_LABELS: Record<WorkflowStepType, string> = {
  spec: 'Specification',
  design: 'Design',
  implement: 'Implementation',
  review: 'Review',
  test: 'Testing',
  submit: 'Submit',
};

/**
 * Prompt templates for each workflow step type
 * Variables: {feature_name}, {feature_description}
 */
const PROMPT_TEMPLATES: Record<WorkflowStepType, string> = {
  spec: `Create a detailed specification for {feature_name}: {feature_description}

Please include:
- Overview and objectives
- Requirements and acceptance criteria
- Technical requirements
- Edge cases and error handling
- Dependencies and constraints`,

  design: `Based on the specification, create a technical design document for {feature_name}.

Please include:
- Architecture overview
- Component design
- Data models and interfaces
- API design (if applicable)
- Implementation plan and considerations`,

  implement: `Implement {feature_name} according to the specification and design documents.

Feature description: {feature_description}

Please:
- Follow the technical design
- Write clean, maintainable code
- Add appropriate comments and documentation
- Consider error handling and edge cases`,

  review: `Review the PR for {feature_name}. 

Check for:
- Code quality and readability
- Adherence to specification
- Test coverage
- Edge cases and error handling
- Security considerations
- Performance implications`,

  test: `Add comprehensive tests for {feature_name}. 

Feature description: {feature_description}

Include:
- Unit tests for individual components
- Integration tests for component interactions
- Edge cases and error scenarios
- Test documentation`,

  submit: `Finalise the PR for {feature_name}. 

Ensure:
- All tests pass
- Documentation is updated
- Code is ready for merge
- PR description is complete
- Any review comments are addressed`,
};

/**
 * Generic template for unknown step types
 */
const GENERIC_TEMPLATE = `Work on {feature_name}: {feature_description}`;

/**
 * Get human-readable label for a workflow step type
 * 
 * @param stepType - The workflow step type
 * @returns Human-readable label
 */
export function getWorkflowStepLabel(stepType: WorkflowStepType): string {
  return STEP_LABELS[stepType] || stepType;
}

/**
 * Get the prompt template for a workflow step type
 * 
 * @param stepType - The workflow step type
 * @returns The prompt template string
 */
export function getPromptTemplate(stepType: WorkflowStepType): string {
  return PROMPT_TEMPLATES[stepType] || GENERIC_TEMPLATE;
}

/**
 * Options for generating a step prompt
 */
export interface StepPromptOptions {
  featureName: string;
  featureDescription: string;
}

/**
 * Generate a prompt for a workflow step
 * 
 * @param stepType - The workflow step type
 * @param options - Feature name and description
 * @returns The generated prompt
 */
export function generateStepPrompt(
  stepType: WorkflowStepType,
  options: StepPromptOptions
): string {
  const template = getPromptTemplate(stepType);
  
  return template
    .replace(/{feature_name}/g, options.featureName)
    .replace(/{feature_description}/g, options.featureDescription);
}
