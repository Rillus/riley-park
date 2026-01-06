# Riley Park Features

This directory contains feature specifications broken down from the Product Requirements Document (PRD).

## Feature Development Order

Features are numbered in recommended development order, starting with the most basic MVP functionality.

### Phase 1: Core MVP (Features 001-006)

1. **Feature 001: Basic Agent Messaging** - The absolute minimum: launch agent and send messages
2. **Feature 002: Agent Conversation View** - View and continue conversations
3. **Feature 003: Agent Status Dashboard** - See all agents and their status
4. **Feature 004: Project Management** - Create and manage projects
5. **Feature 005: Feature Management** - Create and manage features with workflow steps
6. **Feature 006: Agent Launch Integration** - Connect agents to projects and features

### Phase 2: Automation & Context (Features 007-009)

7. **Feature 007: Workflow Automation** - Automate workflow step transitions
8. **Feature 008: Notifications** - Notify users of agent events
9. **Feature 009: Context Management** - Store and use project/feature context

### Phase 3: Advanced Features (Features 010-012)

10. **Feature 010: PR Management** - Track and manage Pull Requests
11. **Feature 011: Prompt Shortcuts** - Library of reusable prompts
12. **Feature 012: UI Foundation** - Design system, navigation, and polish

## Feature Specification Format

Each feature specification includes:

- **Overview** - High-level description
- **Requirements** - Detailed requirements
- **Acceptance Criteria** - Testable criteria
- **Technical Requirements** - Technical details
- **Subtasks** - Breakdown into half-day tasks
- **Dependencies** - Other features or components needed
- **Notes** - Additional context

## Subtask Guidelines

Subtasks are broken down to be completable in approximately half a day (3-4 hours). If a feature is too large, it's split into multiple subtasks.

Each subtask includes:
- Specific deliverables
- Estimated time
- Test requirements
- Integration points

## Development Approach

1. Start with Feature 001 (Basic Agent Messaging)
2. Build incrementally, testing each feature
3. Follow TDD (Test-Driven Development) approach
4. Integrate features as you go
5. Polish and refine after core functionality works

## Feature Status Management

Features can have the following statuses:
- **Not Started** - Feature hasn't been worked on yet
- **In Progress** - Feature is currently being developed
- **✅ Completed** - Feature has been completed and merged

### Updating Feature Status

When a feature is completed via Cloud Agents:

1. **Manual Update (Recommended)**: After merging the PR, update the `**Status:**` field in the feature's markdown file:
   ```
   **Status:** ✅ Completed
   ```

2. **Include in Agent Prompt**: When launching an agent to work on a feature, add this instruction to the prompt:
   > "When you complete this feature and create the PR, update the Status field in the feature spec markdown file (docs/features/XXX-feature-name.md) to '✅ Completed' before submitting the PR."

3. **Automatic Detection (Future)**: We could add automation to detect when a feature branch is merged and automatically update the status, but for now manual updates are the most reliable.

The feature list will automatically reflect the updated status on the next page refresh.

## Notes

- Features can be developed in parallel if dependencies allow
- Some features may need to be adjusted based on API limitations
- UI Foundation (Feature 012) can be built alongside other features
- Consider MVP scope - some features may be simplified for initial release

