# Feature 007: Workflow Automation

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 2 days

## Overview

Automate workflow step transitions. When an agent completes a step, automatically transition to the next step or notify user.

## Requirements

### 1. Monitor Agent Status
- Poll agent status for agents assigned to workflow steps
- Detect when agent status changes to FINISHED
- Trigger workflow step completion logic

### 2. Workflow Step Completion
- When agent finishes:
  - Mark workflow step as "completed"
  - Extract step output (if available from conversation)
  - Store output in workflow_steps.output
  - Check if next step exists
  - If next step exists and is "pending", notify user or auto-start

### 3. Auto-transition Logic
- Option 1: Manual approval (default)
  - When step completes, notify user
  - User manually approves transition to next step
  - User can launch agent for next step
- Option 2: Auto-transition (optional)
  - When step completes, automatically start next step
  - Launch agent for next step with appropriate prompt
  - Only if previous step output is valid

### 4. Step Output Extraction
- Parse agent conversation for step output
- For Specification step: Extract specification document
- For Design step: Extract design document
- For Implementation step: Note PR creation
- For Review step: Extract review comments
- For Testing step: Note test completion
- For Submit step: Note PR finalisation

### 5. Workflow State Management
- Track current step for each feature
- Prevent launching agents for steps out of order
- Allow manual step completion
- Allow re-running steps

## Acceptance Criteria

- [ ] System detects when agent completes a workflow step
- [ ] Workflow step is marked as completed
- [ ] Step output is extracted and stored
- [ ] User is notified of step completion
- [ ] User can transition to next step
- [ ] System prevents out-of-order step execution

## Technical Requirements

### Background Jobs/Polling
- Poll agent status every 5-10 seconds for active agents
- Process agent completion events
- Update workflow steps in database

### Data Updates
- Update workflow_steps.status to "completed"
- Store workflow_steps.output
- Update workflow_steps.updated_at

### Notification System
- In-app notification when step completes
- Link to feature workflow view
- Option to launch next step

## Subtasks

### Subtask 7.1: Agent Status Monitoring (4 hours)
- [ ] Create background job/polling service
- [ ] Poll agents assigned to workflow steps
- [ ] Detect status changes (RUNNING → FINISHED)
- [ ] Trigger completion handler
- [ ] Handle errors and retries
- [ ] Write tests for monitoring logic

### Subtask 7.2: Step Completion Handler (3 hours)
- [ ] Create handler for agent completion
- [ ] Update workflow step status to "completed"
- [ ] Extract step output from conversation
- [ ] Store output in database
- [ ] Determine next step
- [ ] Write tests for completion handler

### Subtask 7.3: Output Extraction (3 hours)
- [ ] Create output extraction logic for each step type
- [ ] Parse conversation for specification document
- [ ] Parse conversation for design document
- [ ] Detect PR creation in conversation
- [ ] Extract review comments
- [ ] Write tests for extraction logic

### Subtask 7.4: Workflow State Management (3 hours)
- [ ] Create workflow state validation
- [ ] Prevent out-of-order step execution
- [ ] Track current step for feature
- [ ] Allow manual step completion
- [ ] Allow re-running steps
- [ ] Write tests for state management

### Subtask 7.5: Auto-transition Logic (2 hours)
- [ ] Create auto-transition option (configurable)
- [ ] Auto-launch next step when previous completes
- [ ] Validate step output before auto-transition
- [ ] Add user preference for auto-transition
- [ ] Write tests for auto-transition

### Subtask 7.6: Notifications (2 hours)
- [ ] Create notification when step completes
- [ ] Add in-app notification component
- [ ] Link to feature workflow view
- [ ] Add "Launch Next Step" action
- [ ] Write tests for notifications

### Subtask 7.7: Integration & Polish (1 hour)
- [ ] Connect all components
- [ ] Add error handling
- [ ] Add logging
- [ ] End-to-end testing

## Dependencies

- Feature 001: Basic Agent Messaging (agent status API)
- Feature 002: Agent Conversation View (conversation API)
- Feature 005: Feature Management (workflow steps)
- Feature 006: Agent Launch Integration (launching agents)

## Notes

- Background polling is simplest for MVP
- Consider WebSocket or webhooks in future for real-time updates
- Output extraction may need refinement based on actual agent responses

