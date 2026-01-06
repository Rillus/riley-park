# Feature 006: Agent Launch Integration

**Priority:** P0 (Must Have)  
**Status:** Not Started  
**Estimated Time:** 1.5 days

## Overview

Integrate agent launching with projects and features. When launching an agent, automatically use project repository and feature context.

## Requirements

### 1. Launch Agent from Project
- Launch agent from project detail view
- Pre-fill:
  - Repository URL (from project)
  - Branch name (from project default branch, or auto-generate)
- User provides:
  - Initial prompt
  - Model selection
  - Optional: Custom branch name

### 2. Launch Agent from Feature
- Launch agent from feature workflow step
- Pre-fill:
  - Repository URL (from project)
  - Branch name (auto-generated: `cursor/feature-name-timestamp`)
  - Initial prompt (based on workflow step)
- Workflow step prompts:
  - **Specification:** "Create a detailed specification for [feature name]: [description]"
  - **Design:** "Based on the specification, create a technical design document for [feature name]"
  - **Implementation:** "Implement [feature name] according to the specification and design documents"
  - **Review:** "Review the PR for [feature name]. Check for: code quality, adherence to spec, test coverage, edge cases"
  - **Testing:** "Add comprehensive tests for [feature name]. Include unit tests, integration tests, and edge cases"
  - **Submit:** "Finalise the PR for [feature name]. Ensure all tests pass, documentation is updated, and code is ready for merge"

### 3. Agent Assignment
- When agent is launched for a workflow step:
  - Store agent ID in workflow step
  - Update step status to "in_progress"
  - Link agent to feature and project

### 4. Agent Configuration
- Auto-create PR: enabled by default
- Skip reviewer request: configurable (default: false)
- Branch naming: `cursor/{feature-slug}-{timestamp}`

## Acceptance Criteria

- [ ] User can launch agent from project view
- [ ] User can launch agent from feature workflow step
- [ ] Agent is automatically configured with project repository
- [ ] Agent prompt is pre-filled based on workflow step
- [ ] Agent is assigned to workflow step
- [ ] Workflow step status updates to "in_progress"

## Technical Requirements

### API Integration
- Use existing `POST /v0/agents` endpoint
- Include project and feature context in agent configuration
- Store agent ID in workflow step

### Data Updates
- Update workflow_steps table:
  - Set agent_id when agent launched
  - Set status to "in_progress"
  - Update updated_at timestamp

### UI Components
- Launch agent button in project view
- Launch agent button in feature workflow step
- Agent launch modal/form (reuse from Feature 001)
- Pre-filled form fields

## Subtasks

### Subtask 6.1: Launch Agent from Project (3 hours)
- [ ] Add "Launch Agent" button to project detail view
- [ ] Create launch modal with pre-filled repository
- [ ] Auto-generate branch name if not provided
- [ ] Integrate with agent launch API
- [ ] Store agent in database (optional agent tracking)
- [ ] Write tests for launch flow

### Subtask 6.2: Launch Agent from Feature Step (4 hours)
- [ ] Add "Launch Agent" button to workflow steps
- [ ] Create launch modal with pre-filled:
  - Repository (from project)
  - Branch (auto-generated)
  - Prompt (based on step type)
- [ ] Generate step-specific prompts
- [ ] Integrate with agent launch API
- [ ] Assign agent to workflow step
- [ ] Update step status to "in_progress"
- [ ] Write tests for launch flow

### Subtask 6.3: Agent Assignment Logic (2 hours)
- [ ] Update workflow step when agent launched
- [ ] Store agent ID in workflow_steps.agent_id
- [ ] Update step status to "in_progress"
- [ ] Add API endpoint to update workflow step
- [ ] Write tests for assignment logic

### Subtask 6.4: Branch Name Generation (1 hour)
- [ ] Create function to generate branch names
- [ ] Format: `cursor/{feature-slug}-{timestamp}`
- [ ] Handle special characters in feature name
- [ ] Write tests for branch name generation

### Subtask 6.5: Step Prompt Templates (2 hours)
- [ ] Create prompt templates for each workflow step
- [ ] Template variables: {feature_name}, {feature_description}
- [ ] Generate prompts based on step type
- [ ] Allow user to edit prompt before launching
- [ ] Write tests for prompt generation

### Subtask 6.6: Integration & Polish (2 hours)
- [ ] Connect all components
- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add success notifications
- [ ] Update UI after agent launch
- [ ] End-to-end testing

## Dependencies

- Feature 001: Basic Agent Messaging (agent launch API)
- Feature 004: Project Management (project data)
- Feature 005: Feature Management (feature and workflow step data)

## Notes

- This connects the agent system with project/feature management
- Branch names should be URL-safe
- Prompt templates can be customised later

