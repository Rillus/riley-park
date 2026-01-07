# Feature 003: Agent Status Dashboard

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 1 day

## Overview

A centralised dashboard showing all active agents, their status, and quick actions. This provides visibility into what agents are working on.

## Requirements

### 1. Agent List Display
- Display all agents in a list/table view
- Show for each agent:
  - Agent ID
  - Repository URL
  - Branch name
  - Status (RUNNING, FINISHED, STOPPED, ERROR)
  - Progress indicator (if available)
  - Time elapsed
  - Created timestamp
- Use Cursor API: `GET /v0/agents`
- Filter by status (all, running, finished, stopped, error)

### 2. Real-time Updates
- Auto-refresh agent list every 5 seconds
- Highlight status changes
- Show loading states during refresh

### 3. Quick Actions
- View conversation (link to conversation view)
- Stop agent (if RUNNING)
- Delete agent (if FINISHED or STOPPED)
- Restart agent (if STOPPED or ERROR)

### 4. Agent Details
- Click agent to see detailed view
- Show full agent information
- Link to conversation
- Link to PR (if created)

## Acceptance Criteria

- [ ] User can see all agents in one view
- [ ] Agent status updates in near real-time
- [ ] User can filter agents by status
- [ ] User can perform quick actions on agents
- [ ] User can navigate to agent details/conversation

## Technical Requirements

### API Integration
- Use `GET /v0/agents` to list all agents
- Poll every 5 seconds for updates
- Use `POST /v0/agents/{id}/stop` to stop agents
- Use `DELETE /v0/agents/{id}` to delete agents

### UI Components
- Agent list/table component
- Agent card/row component
- Status badge component
- Filter component
- Action buttons component
- Loading/refresh indicator

## Subtasks

### Subtask 3.1: List Agents API Integration (2 hours)
- [ ] Create `listAgents()` API function
- [ ] Create `stopAgent(agentId)` API function
- [ ] Create `deleteAgent(agentId)` API function
- [ ] Handle API errors
- [ ] Write tests for API functions

### Subtask 3.2: Agent List Display (3 hours)
- [ ] Create agent list component
- [ ] Create agent card/row component
- [ ] Display all agent information
- [ ] Add status badges with colours
- [ ] Add time elapsed calculation
- [ ] Add progress indicator (if available)
- [ ] Write tests for components

### Subtask 3.3: Filtering & Sorting (2 hours)
- [ ] Add status filter dropdown
- [ ] Implement filtering logic
- [ ] Add sorting (by status, created time)
- [ ] Persist filter preferences
- [ ] Write tests for filtering

### Subtask 3.4: Quick Actions (2 hours)
- [ ] Add action buttons to each agent
- [ ] Implement stop agent functionality
- [ ] Implement delete agent functionality
- [ ] Add confirmation dialogs for destructive actions
- [ ] Update list after actions
- [ ] Write tests for actions

### Subtask 3.5: Auto-refresh & Real-time Updates (1 hour)
- [ ] Implement polling for agent list
- [ ] Highlight status changes
- [ ] Add loading indicator
- [ ] Optimise to avoid unnecessary re-renders
- [ ] Write tests for polling

## Dependencies

- Feature 001: Basic Agent Messaging (for agent data structure)
- Feature 002: Agent Conversation View (for navigation)

## Notes

- Dashboard is the main entry point for agent management
- Real-time updates are important for visibility
- Consider WebSocket support in future for true real-time updates

