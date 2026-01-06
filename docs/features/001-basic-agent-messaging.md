# Feature 001: Basic Agent Messaging (MVP)

**Priority:** P0 (Must Have)  
**Status:** Not Started  
**Estimated Time:** 1 day

## Overview

The most basic MVP feature: ability to launch a Cursor Cloud Agent and send it a message. This is the foundation for all other features.

## Requirements

### 1. Launch Agent
- User can launch a new Cursor Cloud Agent via the UI
- Required inputs:
  - Repository URL (text input)
  - Branch name (text input, optional - defaults to auto-generated)
  - Initial prompt (textarea)
  - Model selection (dropdown, defaults to "Auto")
- Use Cursor API: `POST /v0/agents`
- Display success/error message after launch
- Store agent ID for future reference

### 2. Post Follow-up Message
- User can send a follow-up message to an existing agent
- Required inputs:
  - Agent ID (from launched agent)
  - Message text (textarea)
  - Optional: Image attachments (max 5)
- Use Cursor API: `POST /v0/agents/{id}/followup`
- Display success/error message after sending

### 3. View Agent Status
- User can check the status of an agent
- Display:
  - Agent ID
  - Status (RUNNING, FINISHED, STOPPED, ERROR)
  - Repository and branch
  - Created timestamp
- Use Cursor API: `GET /v0/agents/{id}`
- Auto-refresh status every 5 seconds while agent is running

## Acceptance Criteria

- [ ] User can launch an agent with repository, branch, and prompt
- [ ] User can send a follow-up message to a launched agent
- [ ] User can view agent status
- [ ] All API calls handle errors gracefully
- [ ] UI provides clear feedback for all actions

## Technical Requirements

### API Integration
- Integrate with Cursor Cloud Agents API
- Authentication: Basic Auth with API key (stored securely)
- Error handling for API failures
- Rate limiting awareness

### Data Storage
- Store agent records temporarily (in-memory or simple database)
  - Agent ID
  - Repository URL
  - Branch name
  - Status
  - Created timestamp
  - Last updated timestamp

### UI Components
- Simple form for launching agent
- Simple form for sending follow-up
- Status display component
- Error message display

## Subtasks

### Subtask 1.1: API Client Setup (2 hours)
- [ ] Set up HTTP client for Cursor API
- [ ] Implement authentication (API key storage)
- [ ] Create API client functions:
  - `launchAgent(repository, branch, prompt, model)`
  - `sendFollowup(agentId, message, images)`
  - `getAgentStatus(agentId)`
- [ ] Add error handling and retry logic
- [ ] Write tests for API client

### Subtask 1.2: Launch Agent UI (3 hours)
- [ ] Create launch agent form component
- [ ] Add form validation
- [ ] Integrate with API client
- [ ] Display success/error messages
- [ ] Store agent ID after successful launch
- [ ] Write tests for launch flow

### Subtask 1.3: Follow-up Message UI (2 hours)
- [ ] Create follow-up message form component
- [ ] Add agent ID input/selection
- [ ] Add message textarea
- [ ] Add image upload (optional, max 5)
- [ ] Integrate with API client
- [ ] Display success/error messages
- [ ] Write tests for follow-up flow

### Subtask 1.4: Agent Status Display (2 hours)
- [ ] Create agent status component
- [ ] Display agent information
- [ ] Implement auto-refresh (polling every 5 seconds)
- [ ] Handle different status states (RUNNING, FINISHED, etc.)
- [ ] Write tests for status display

### Subtask 1.5: Integration & Polish (1 hour)
- [ ] Connect all components
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add basic styling
- [ ] End-to-end testing

## Dependencies

- Cursor Cloud Agents API access
- API key for authentication
- Basic web framework setup (React/Next.js recommended)

## Notes

- This is the absolute minimum viable feature
- No project/feature management yet - just direct agent interaction
- Simple UI is acceptable for MVP
- Focus on getting the API integration working correctly

