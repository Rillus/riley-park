# Feature 001b: Feature List & Spec Loader

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 0.5 days

## Overview

A feature list view that displays all available features from the docs/features directory. Clicking a feature loads its specification into the agent chat window, enabling rapid development by using the app to build itself.

## Requirements

### 1. Feature List Display
- Read all feature markdown files from `docs/features/` directory
- Display features in a list/card view showing:
  - Feature number and title
  - Status (Not Started, In Progress, Completed)
  - Priority (P0, P1, etc.)
  - Estimated time
- Filter by status
- Sort by feature number or priority

### 2. Feature Spec Loading
- Click on a feature to load its full specification
- Display spec in a readable format (markdown rendered)
- Show spec in a modal or dedicated view
- "Load into Chat" button that:
  - Takes the feature spec content
  - Pre-fills the agent prompt with the spec
  - Ready to launch agent with the spec as context

### 3. Integration with Agent Launch
- When "Load into Chat" is clicked:
  - Pre-fill the launch agent form with appropriate prompt
  - Include the full feature spec in the prompt
  - Suggest repository and branch if applicable
  - User can then launch agent with spec as context

## Acceptance Criteria

- [ ] User can see all features from docs/features directory
- [ ] User can click a feature to view its spec
- [ ] User can load feature spec into agent chat
- [ ] Feature spec is properly formatted in the prompt
- [ ] Status and metadata are displayed correctly

## Technical Requirements

### File Reading
- Read markdown files from `docs/features/` directory
- Parse frontmatter/metadata from feature files
- Extract status, priority, estimated time from markdown

### UI Components
- Feature list component
- Feature card component
- Feature spec viewer (modal or page)
- Integration with LaunchAgentForm

### Data Parsing
- Parse markdown files
- Extract metadata (status, priority, etc.)
- Format spec for agent prompt

## Subtasks

### Subtask 1.1: Feature File Reader (1 hour)
- [ ] Create API route to read feature files
- [ ] Parse markdown files from docs/features
- [ ] Extract metadata (status, priority, title)
- [ ] Return structured feature data
- [ ] Write tests for file reading

### Subtask 1.2: Feature List UI (2 hours)
- [ ] Create feature list component
- [ ] Display features with metadata
- [ ] Add filtering by status
- [ ] Add sorting
- [ ] Write tests for component

### Subtask 1.3: Feature Spec Viewer (1 hour)
- [ ] Create feature spec viewer component
- [ ] Render markdown content
- [ ] Display full specification
- [ ] Add "Load into Chat" button
- [ ] Write tests for viewer

### Subtask 1.4: Integration with Agent Launch (1 hour)
- [ ] Connect feature spec to LaunchAgentForm
- [ ] Pre-fill prompt with spec content
- [ ] Format spec appropriately for agent
- [ ] Test end-to-end flow

## Dependencies

- Feature 001: Basic Agent Messaging (for agent launch integration)
- Markdown parsing library
- File system access (API routes)

## Notes

- This is a meta-feature to accelerate development
- Should be simple and fast to implement
- Focus on making it easy to load specs into agents
- Can be enhanced later with more metadata extraction

