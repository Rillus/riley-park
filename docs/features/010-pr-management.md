# Feature 010: PR Management

**Priority:** P0 (Must Have)  
**Status:** Not Started  
**Estimated Time:** 2 days

## Overview

Track and manage Pull Requests created by agents. Link PRs to features and workflow steps.

## Requirements

### 1. PR Detection
- Detect when agent creates a PR:
  - Parse agent conversation for PR URLs
  - Or use GitHub API to detect new PRs (if GitHub integration available)
- Extract PR information:
  - PR URL
  - PR title
  - PR number
  - Branch name
  - Status (draft, open, merged, closed)

### 2. PR Storage
- Store PR information in database
- Link PR to:
  - Feature
  - Workflow step (usually Implementation or Submit)
  - Agent that created it
- Track PR status updates

### 3. PR List View
- Display all PRs created by agents
- Show:
  - PR title
  - Feature name
  - Project
  - Status (draft, open, merged, closed)
  - Agent that created it
  - Created timestamp
  - Link to PR on GitHub
- Filter by: project, feature, status
- Sort by: created date, status

### 4. PR Detail View
- Display PR information
- Show:
  - PR details (title, description, status)
  - Link to PR on GitHub
  - Associated feature and workflow step
  - Agent that created it
  - PR review comments (if available)
- Actions:
  - Open PR on GitHub
  - Review PR (link to Cursor or GitHub)
  - Merge PR (if GitHub integration available)
  - Close PR

### 5. PR Status Updates
- Poll PR status (if GitHub API available)
- Or manually refresh PR status
- Update PR status in database
- Notify user of status changes

### 6. PR in Workflow View
- Display PR link in workflow step
- Show PR status in workflow view
- Link from workflow step to PR

## Acceptance Criteria

- [ ] System detects when agent creates a PR
- [ ] PR is stored and linked to feature/step
- [ ] User can see all PRs in one view
- [ ] User can navigate to PR on GitHub
- [ ] PR status is displayed in workflow view
- [ ] PR status updates are tracked

## Technical Requirements

### Data Storage
- Database table: `pull_requests`
  - id (primary key)
  - feature_id (foreign key to features)
  - workflow_step_id (foreign key to workflow_steps)
  - agent_id (string - Cursor agent ID)
  - pr_url (string, required)
  - pr_number (integer, nullable)
  - pr_title (string)
  - branch_name (string)
  - status (enum: draft, open, merged, closed)
  - github_pr_id (string, nullable - if GitHub integration)
  - created_at (timestamp)
  - updated_at (timestamp)
- Database migrations
- ORM models

### API Endpoints
- `GET /api/pull-requests` - List all PRs
- `GET /api/pull-requests/:id` - Get PR details
- `POST /api/pull-requests` - Create PR record (from detection)
- `PUT /api/pull-requests/:id` - Update PR status
- `GET /api/features/:id/pull-requests` - Get PRs for feature

### PR Detection
- Parse agent conversation for PR URLs
- Extract PR information from URL
- Create PR record automatically

### GitHub Integration (Optional for MVP)
- GitHub API integration for PR status
- OAuth for GitHub access
- Poll PR status from GitHub API

## Subtasks

### Subtask 10.1: Database Schema & Models (2 hours)
- [ ] Create pull_requests table migration
- [ ] Create PullRequest model
- [ ] Add relationships to features and workflow steps
- [ ] Write tests for model

### Subtask 10.2: PR Detection Service (4 hours)
- [ ] Create PR detection service
- [ ] Parse agent conversation for PR URLs
- [ ] Extract PR information from URL
- [ ] Detect PR creation in conversation
- [ ] Create PR record automatically
- [ ] Link PR to feature and workflow step
- [ ] Write tests for detection service

### Subtask 10.3: PR API Endpoints (3 hours)
- [ ] Create GET /api/pull-requests endpoint
- [ ] Create GET /api/pull-requests/:id endpoint
- [ ] Create POST /api/pull-requests endpoint
- [ ] Create PUT /api/pull-requests/:id endpoint
- [ ] Create GET /api/features/:id/pull-requests endpoint
- [ ] Add filtering and sorting
- [ ] Write tests for all endpoints

### Subtask 10.4: PR List View (3 hours)
- [ ] Create PR list component
- [ ] Create PR card/row component
- [ ] Fetch and display PRs
- [ ] Add filtering by project/feature/status
- [ ] Add sorting
- [ ] Add link to PR on GitHub
- [ ] Write tests for components

### Subtask 10.5: PR Detail View (2 hours)
- [ ] Create PR detail component
- [ ] Display PR information
- [ ] Show associated feature and step
- [ ] Add link to PR on GitHub
- [ ] Add actions (if GitHub integration available)
- [ ] Write tests for component

### Subtask 10.6: PR in Workflow View (2 hours)
- [ ] Display PR link in workflow step
- [ ] Show PR status badge
- [ ] Add navigation to PR detail
- [ ] Update workflow step when PR detected
- [ ] Write tests for workflow integration

### Subtask 10.7: PR Status Updates (2 hours)
- [ ] Create PR status polling (if GitHub API available)
- [ ] Or add manual refresh button
- [ ] Update PR status in database
- [ ] Notify user of status changes
- [ ] Write tests for status updates

### Subtask 10.8: Integration & Polish (2 hours)
- [ ] Integrate PR detection with agent conversation monitoring
- [ ] Connect all components
- [ ] Add loading states
- [ ] Improve error handling
- [ ] End-to-end testing

## Dependencies

- Feature 002: Agent Conversation View (for PR detection)
- Feature 005: Feature Management (for PR linking)
- Feature 007: Workflow Automation (for step linking)
- Optional: GitHub API integration

## Notes

- PR detection from conversation is sufficient for MVP
- GitHub API integration can be added later
- PR status updates may require GitHub API or manual refresh

