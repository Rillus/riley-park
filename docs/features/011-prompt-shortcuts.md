# Feature 011: Prompt Shortcuts

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 1.5 days

## Overview

Library of pre-defined and user-defined prompt shortcuts for common tasks. Quick access to frequently used prompts.

## Requirements

### 1. Pre-defined Shortcuts
- **Create Spec:** "Create a detailed specification for [feature]. Include: requirements, acceptance criteria, technical constraints, user stories"
- **Review PR:** "Review this PR thoroughly. Check: code quality, adherence to requirements, test coverage, edge cases, performance, security"
- **Add Tests:** "Add comprehensive tests for [feature]. Include: unit tests, integration tests, edge cases, error handling"
- **Refactor:** "Refactor this code to improve: readability, maintainability, performance, following best practices"
- **Documentation:** "Add/update documentation for [feature]. Include: README updates, code comments, API documentation"

### 2. User-defined Shortcuts
- User can create custom prompt templates
- Use variables: `{feature}`, `{project}`, `{step}`, `{description}`
- Save to library
- Edit existing shortcuts
- Delete shortcuts

### 3. Shortcut Library View
- Display all shortcuts (pre-defined and user-defined)
- Group by category (optional)
- Search shortcuts
- Quick actions: Use, Edit, Delete

### 4. Using Shortcuts
- Access shortcuts from:
  - Agent conversation view (quick action buttons)
  - Agent launch form (shortcut selector)
  - Feature workflow step (context-aware shortcuts)
- Fill in variables automatically
- Insert shortcut text into prompt input
- User can edit before sending

### 5. Context-aware Shortcuts
- Show relevant shortcuts based on context:
  - In Specification step: Show "Create Spec" shortcut
  - In Review step: Show "Review PR" shortcut
  - In Testing step: Show "Add Tests" shortcut
- Hide irrelevant shortcuts

## Acceptance Criteria

- [x] User can access pre-defined shortcuts
- [x] User can create custom shortcuts
- [x] User can use shortcuts in agent conversations
- [x] Shortcuts fill in variables automatically
- [x] User can edit shortcut text before sending
- [x] Context-aware shortcuts are shown appropriately

## Technical Requirements

### Data Storage
- Database table: `shortcuts`
  - id (primary key)
  - name (string, required)
  - prompt_template (text, required)
  - category (string, nullable - for grouping)
  - is_predefined (boolean, default: false)
  - user_id (foreign key, nullable for MVP - single user)
  - variables (json, nullable - list of variables used)
  - created_at (timestamp)
  - updated_at (timestamp)
- Database migrations
- ORM models

### API Endpoints
- `GET /api/shortcuts` - List all shortcuts
- `GET /api/shortcuts/:id` - Get shortcut details
- `POST /api/shortcuts` - Create shortcut
- `PUT /api/shortcuts/:id` - Update shortcut
- `DELETE /api/shortcuts/:id` - Delete shortcut
- `POST /api/shortcuts/:id/expand` - Expand shortcut with variables

### Variable Expansion
- Function to expand shortcut variables
- Replace `{feature}` with feature name
- Replace `{project}` with project name
- Replace `{step}` with workflow step name
- Replace `{description}` with feature description

## Subtasks

### Subtask 11.1: Database Schema & Models (2 hours)
- [x] Create shortcuts table migration
- [x] Create Shortcut model
- [x] Seed pre-defined shortcuts
- [x] Write tests for model

### Subtask 11.2: Shortcut API Endpoints (3 hours)
- [x] Create GET /api/shortcuts endpoint
- [x] Create GET /api/shortcuts/:id endpoint
- [x] Create POST /api/shortcuts endpoint
- [x] Create PUT /api/shortcuts/:id endpoint
- [x] Create DELETE /api/shortcuts/:id endpoint
- [x] Create POST /api/shortcuts/:id/expand endpoint
- [x] Add input validation
- [x] Write tests for all endpoints

### Subtask 11.3: Variable Expansion Service (2 hours)
- [x] Create variable expansion function
- [x] Parse shortcut template for variables
- [x] Replace variables with actual values
- [x] Handle missing variables gracefully
- [x] Write tests for expansion

### Subtask 11.4: Shortcut Library UI (3 hours)
- [x] Create shortcut library view
- [x] Display shortcuts list
- [x] Add search functionality
- [x] Add category grouping (optional)
- [x] Add "Use", "Edit", "Delete" actions
- [x] Write tests for components

### Subtask 11.5: Create/Edit Shortcut UI (2 hours)
- [x] Create shortcut form component
- [x] Add name, template, category fields
- [x] Show variable hints
- [x] Add validation
- [x] Integrate with create/update API
- [x] Write tests for form

### Subtask 11.6: Shortcut Expansion Service (2 hours)
- [x] Create service to expand shortcuts with variables
- [x] Create hook/utility for shortcut expansion
- [x] Write tests for expansion service
- **Note:** UI integration with agent launch form will be done in Feature 014 (Task 14.1)
- **Note:** UI integration with conversation view will be done in Feature 014 (Task 14.6)
- **Note:** UI integration with workflow steps will be done in Feature 014 (Task 14.2)

### Subtask 11.7: Core Functionality Polish (1 hour)
- [x] Improve shortcut library UI
- [x] Add shortcut preview in library
- [x] Add keyboard shortcuts (optional)
- [x] End-to-end testing of core functionality
- **Note:** Navigation integration will be done in Feature 014 (Task 14.5)

## Dependencies

- Feature 001: Basic Agent Messaging (for using shortcuts)
- Feature 002: Agent Conversation View (for quick actions)
- Feature 005: Feature Management (for context)
- Database setup

## Integration Tasks

After completing this feature, the following integration tasks from Feature 014 should be completed:
- Task 14.1: Agent Launch Form Integration (integrates shortcut selector)
- Task 14.2: Workflow Step Component Integration (integrates context-aware shortcuts)
- Task 14.5: Navigation Integration (adds Shortcuts to navigation)
- Task 14.6: Conversation View Integration (integrates quick action buttons)

## Notes

- Shortcuts significantly improve productivity
- Variable expansion makes shortcuts reusable
- Context-aware shortcuts reduce cognitive load
- Consider adding more pre-defined shortcuts based on usage

