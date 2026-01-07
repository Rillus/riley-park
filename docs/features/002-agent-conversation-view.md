# Feature 002: Agent Conversation View

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 1 day

## Overview

Display the full conversation history between user and agent, allowing users to see what the agent has been working on and continue the conversation.

## Requirements

### 1. Display Conversation History
- Fetch and display full conversation from agent
- Show:
  - User prompts (with timestamps)
  - Assistant responses (with timestamps)
  - Code changes (if applicable)
  - Message formatting (markdown support)
- Use Cursor API: `GET /v0/agents/{id}/conversation`
- Auto-refresh conversation when agent sends new messages

### 2. Continue Conversation
- Add follow-up prompt input at bottom of conversation
- Support text input
- Support image attachments (max 5)
- Send button to submit message
- Clear input after successful send

### 3. Navigation
- Link from agent status to conversation view
- Link from agent list to conversation view
- Back button to return to previous view

## Acceptance Criteria

- [ ] User can view full conversation history
- [ ] Conversation displays in chronological order
- [ ] User can send follow-up messages from conversation view
- [ ] Conversation auto-updates when agent responds
- [ ] Messages are properly formatted (markdown)
- [ ] Code blocks are syntax-highlighted

## Technical Requirements

### API Integration
- Use `GET /v0/agents/{id}/conversation` endpoint
- Poll for updates every 5 seconds while agent is RUNNING
- Cache conversation to avoid unnecessary API calls

### UI Components
- Conversation message list component
- Message bubble component (user vs assistant)
- Markdown renderer
- Code syntax highlighter
- Follow-up input component
- Image upload component

## Subtasks

### Subtask 2.1: Conversation API Integration (2 hours)
- [ ] Create `getConversation(agentId)` API function
- [ ] Handle pagination if needed
- [ ] Parse conversation data structure
- [ ] Add error handling
- [ ] Write tests for API integration

### Subtask 2.2: Conversation Display Component (3 hours)
- [ ] Create conversation list component
- [ ] Create message bubble component
- [ ] Implement markdown rendering
- [ ] Add syntax highlighting for code blocks
- [ ] Add timestamps
- [ ] Style user vs assistant messages differently
- [ ] Write tests for components

### Subtask 2.3: Follow-up Input in Conversation (2 hours)
- [ ] Add follow-up input to conversation view
- [ ] Integrate with existing follow-up API
- [ ] Add image upload support
- [ ] Clear input after send
- [ ] Show loading state while sending
- [ ] Write tests for follow-up flow

### Subtask 2.4: Auto-refresh & Polling (2 hours)
- [ ] Implement polling for conversation updates
- [ ] Only poll while agent is RUNNING
- [ ] Handle new messages gracefully (scroll to bottom)
- [ ] Optimise to avoid unnecessary re-renders
- [ ] Write tests for polling logic

### Subtask 2.5: Navigation & Integration (1 hour)
- [ ] Add navigation links to conversation view
- [ ] Add back button
- [ ] Integrate with agent status/list views
- [ ] End-to-end testing

## Dependencies

- Feature 001: Basic Agent Messaging (for follow-up functionality)

## Notes

- Conversation view is essential for understanding agent progress
- Markdown rendering is important for code display
- Consider virtual scrolling for long conversations

