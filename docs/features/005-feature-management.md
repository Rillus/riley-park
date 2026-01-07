# Feature 005: Feature Management

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 2 days

## Overview

Manage features within projects - create, view, edit, and track features through their workflow steps.

## Requirements

### 1. Feature Creation
- Create feature with:
  - Title (required)
  - Description (required)
  - Project assignment (required, dropdown)
  - Priority (high, medium, low, default: medium)
  - Optional: Dependencies on other features
- Feature automatically gets workflow steps:
  1. Specification
  2. Design
  3. Implementation
  4. Review
  5. Testing
  6. Submit (PR)
- Each step initialised with status: "pending"

### 2. Feature List View
- Display features for a project
- Show:
  - Title
  - Description
  - Priority
  - Current workflow step
  - Status (planned, in progress, completed, blocked)
  - Created timestamp
- Filter by status or priority
- Sort by priority, created date, or status

### 3. Feature Detail View
- Display feature information
- Show workflow progress:
  - Visual workflow indicator
  - Each step shows:
    - Status (pending, in progress, completed, blocked)
    - Agent assigned (if any)
    - Last updated timestamp
- Actions:
  - Edit feature
  - Delete feature (with confirmation)
  - Launch agent for workflow step
  - Mark step complete (manual)

### 4. Feature Workflow View
- Visual workflow progress indicator:
  ```
  [Spec] → [Design] → [Implement] → [Review] → [Test] → [Submit]
  ```
- Click step to:
  - View step details
  - Launch agent for this step
  - View agent conversation (if agent assigned)
  - Manually mark complete
  - Re-run step with new agent

### 5. Edit Feature
- Edit title, description, priority
- Update dependencies
- Save changes

### 6. Delete Feature
- Delete feature with confirmation
- Handle cascade delete of workflow steps
- Remove from database

## Acceptance Criteria

- [ ] User can create a feature in < 30 seconds
- [ ] Feature is automatically assigned to project
- [ ] Feature workflow steps are initialised
- [ ] User can see feature progress at a glance
- [ ] User can interact with each workflow step
- [ ] Features are stored persistently

## Technical Requirements

### Data Storage
- Database table: `features`
  - id (primary key)
  - project_id (foreign key to projects)
  - title (string, required)
  - description (text, required)
  - priority (enum: high, medium, low)
  - status (enum: planned, in_progress, completed, blocked)
  - created_at (timestamp)
  - updated_at (timestamp)
- Database table: `workflow_steps`
  - id (primary key)
  - feature_id (foreign key to features)
  - step_type (enum: spec, design, implement, review, test, submit)
  - status (enum: pending, in_progress, completed, blocked)
  - agent_id (string, nullable - Cursor agent ID)
  - output (text, nullable - step output/documentation)
  - created_at (timestamp)
  - updated_at (timestamp)
- Database migrations
- ORM models

### API Endpoints
- `GET /api/projects/:projectId/features` - List features for project
- `GET /api/features/:id` - Get feature details
- `POST /api/features` - Create feature
- `PUT /api/features/:id` - Update feature
- `DELETE /api/features/:id` - Delete feature
- `GET /api/features/:id/workflow` - Get workflow steps
- `PUT /api/workflow-steps/:id` - Update workflow step

### UI Components
- Feature list component
- Feature card component
- Create feature form
- Feature detail view
- Workflow progress indicator
- Workflow step component
- Edit feature form
- Delete confirmation dialog

## Subtasks

### Subtask 5.1: Database Schema & Models (4 hours)
- [ ] Create features table migration
- [ ] Create workflow_steps table migration
- [ ] Create Feature model
- [ ] Create WorkflowStep model
- [ ] Add relationships and constraints
- [ ] Write tests for models

### Subtask 5.2: Feature API Endpoints (4 hours)
- [ ] Create GET /api/projects/:projectId/features
- [ ] Create GET /api/features/:id
- [ ] Create POST /api/features (with workflow step creation)
- [ ] Create PUT /api/features/:id
- [ ] Create DELETE /api/features/:id
- [ ] Create GET /api/features/:id/workflow
- [ ] Create PUT /api/workflow-steps/:id
- [ ] Add input validation
- [ ] Add error handling
- [ ] Write tests for all endpoints

### Subtask 5.3: Create Feature (3 hours)
- [ ] Create feature form component
- [ ] Add project selection dropdown
- [ ] Add priority selection
- [ ] Add form validation
- [ ] Integrate with create API
- [ ] Auto-create workflow steps on feature creation
- [ ] Display success/error messages
- [ ] Navigate to feature detail after creation
- [ ] Write tests for create flow

### Subtask 5.4: Feature List View (2 hours)
- [ ] Create feature list component
- [ ] Create feature card component
- [ ] Fetch and display features
- [ ] Add filter by status/priority
- [ ] Add sorting
- [ ] Add navigation to feature details
- [ ] Write tests for components

### Subtask 5.5: Feature Detail View (3 hours)
- [ ] Create feature detail component
- [ ] Display feature information
- [ ] Show workflow progress indicator
- [ ] Display workflow steps with status
- [ ] Add edit/delete buttons
- [ ] Add "Launch Agent" button for steps
- [ ] Write tests for component

### Subtask 5.6: Workflow Step Interaction (3 hours)
- [ ] Make workflow steps clickable
- [ ] Create step detail modal/view
- [ ] Add "Launch Agent" functionality (placeholder)
- [ ] Add "Mark Complete" functionality
- [ ] Display agent assignment
- [ ] Link to agent conversation (placeholder)
- [ ] Write tests for step interactions

### Subtask 5.7: Edit & Delete Feature (2 hours)
- [ ] Create edit feature form
- [ ] Integrate with update API
- [ ] Add delete confirmation dialog
- [ ] Integrate with delete API
- [ ] Handle cascade delete of workflow steps
- [ ] Write tests for edit/delete flows

### Subtask 5.8: Integration & Polish (1 hour)
- [ ] Connect all components
- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add basic styling
- [ ] End-to-end testing

## Dependencies

- Feature 004: Project Management (features belong to projects)
- Database setup
- ORM setup

## Notes

- Workflow steps are automatically created when feature is created
- Step status transitions will be handled in workflow automation feature
- Agent assignment will be connected in later features

