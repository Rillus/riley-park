# Feature 008: Notifications

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 1.5 days

## Overview

Notification system to alert users about agent events, workflow progress, and PR updates.

## Requirements

### 1. Notification Types
- **Agent Finished:** Agent completed its task
- **Agent Needs Input:** Agent is blocked or needs clarification (detected from conversation)
- **PR Created:** Agent created a PR (detected from conversation or API)
- **PR Review Ready:** Agent completed review
- **Workflow Step Complete:** Step completed, next step ready
- **Error:** Agent encountered an error

### 2. In-App Notifications
- Notification bell icon in header
- Notification dropdown/list
- Show:
  - Notification type/icon
  - Title
  - Message
  - Timestamp
  - Action button (e.g., "View Agent", "View PR")
- Mark as read/unread
- Dismiss notification
- Clear all notifications

### 3. Notification Delivery
- Real-time delivery (via polling or WebSocket)
- Notification appears within 5 seconds of event
- Notification persists until user dismisses

### 4. Notification Actions
- Click notification to navigate to relevant view:
  - Agent conversation
  - Feature workflow
  - PR (on GitHub or in-app)
  - Agent status dashboard

## Acceptance Criteria

- [ ] User receives notifications for all event types
- [ ] Notifications appear within 5 seconds of event
- [ ] User can view all notifications in one place
- [ ] User can mark notifications as read
- [ ] User can dismiss notifications
- [ ] User can navigate to relevant views from notifications

## Technical Requirements

### Data Storage
- Database table: `notifications`
  - id (primary key)
  - user_id (foreign key, for multi-user support - nullable for MVP)
  - type (enum: agent_finished, agent_needs_input, pr_created, pr_review_ready, step_complete, error)
  - title (string)
  - message (text)
  - read (boolean, default: false)
  - action_url (string, nullable - link to relevant view)
  - metadata (json, nullable - additional data)
  - created_at (timestamp)
- Database migrations
- ORM models

### API Endpoints
- `GET /api/notifications` - List notifications (unread first)
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Dismiss notification
- `POST /api/notifications/clear` - Clear all notifications

### UI Components
- Notification bell icon
- Notification dropdown
- Notification item component
- Notification badge (unread count)

## Subtasks

### Subtask 8.1: Database Schema & Models (2 hours)
- [ ] Create notifications table migration
- [ ] Create Notification model
- [ ] Add indexes for user_id and read status
- [ ] Write tests for model

### Subtask 8.2: Notification API Endpoints (3 hours)
- [ ] Create GET /api/notifications endpoint
- [ ] Create PUT /api/notifications/:id/read endpoint
- [ ] Create DELETE /api/notifications/:id endpoint
- [ ] Create POST /api/notifications/clear endpoint
- [ ] Add filtering (unread only, by type)
- [ ] Add pagination
- [ ] Write tests for all endpoints

### Subtask 8.3: Notification Creation Service (3 hours)
- [ ] Create notification service/helper
- [ ] Functions for each notification type:
  - `notifyAgentFinished(agentId, featureId)`
  - `notifyAgentNeedsInput(agentId, featureId)`
  - `notifyPRCreated(prUrl, featureId)`
  - `notifyStepComplete(featureId, stepId)`
  - `notifyError(agentId, error)`
- [ ] Integrate with workflow automation
- [ ] Write tests for notification service

### Subtask 8.4: Notification UI Components (4 hours)
- [ ] Create notification bell icon component
- [ ] Create notification badge (unread count)
- [ ] Create notification dropdown component
- [ ] Create notification item component
- [ ] Add mark as read functionality
- [ ] Add dismiss functionality
- [ ] Add navigation to action URLs
- [ ] Style notifications
- [ ] Write tests for components

### Subtask 8.5: Real-time Updates (2 hours)
- [ ] Poll for new notifications every 5 seconds
- [ ] Update notification count badge
- [ ] Show new notifications in dropdown
- [ ] Highlight unread notifications
- [ ] Write tests for polling

### Subtask 8.6: Integration with Events (2 hours)
- [ ] Integrate with agent status monitoring
- [ ] Integrate with workflow automation
- [ ] Create notifications when events occur
- [ ] Test end-to-end notification flow
- [ ] Write integration tests

### Subtask 8.7: Polish & UX (1 hour)
- [ ] Add notification animations
- [ ] Improve notification messages
- [ ] Add notification preferences (placeholder)
- [ ] End-to-end testing

## Dependencies

- Feature 007: Workflow Automation (for step completion events)
- Feature 006: Agent Launch Integration (for agent events)
- Database setup

## Notes

- In-app notifications are sufficient for MVP
- Browser notifications can be added later
- Email notifications can be added later
- Consider WebSocket for true real-time in future

