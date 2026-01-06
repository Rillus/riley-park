# Riley Park Web UI - Product Requirements Document

**Version:** 1.0  
**Date:** January 2025  
**Status:** Draft  
**Author:** Riley Ramone

---

## Executive Summary

Riley Park Web UI is a web-based orchestrator for managing multiple Cursor Cloud Agents. It provides a centralised interface for managing projects, features, and agents, with automated workflows following best-practice AI coding techniques (specification-driven development, design → implement → review → test → submit).

**Key Value Proposition:**
- Visual management of multiple cloud agents across projects
- Automated workflow orchestration (spec → design → implement → review → test → submit)
- Context preservation across agent sessions
- Notification system for agent status and PR reviews
- Prompt shortcuts for common tasks

---

## Problem Statement

### Current Pain Points

1. **No Centralised Management:** Managing multiple Cursor Cloud Agents via CLI/API is fragmented
2. **Lost Context:** Agent sessions don't preserve context between runs
3. **Manual Workflow:** No automated workflow for spec → design → implement → review → test → submit
4. **No Visibility:** Hard to see what agents are working on, their status, and when they need input
5. **Repetitive Prompts:** Common tasks (create spec, review PR) require manual prompt construction

### Target Users

- **Primary:** Riley Ramone (Product Engineer, solo developer)
- **Secondary:** Other developers using Cursor Cloud Agents for multi-agent workflows

---

## Goals & Success Metrics

### Goals

1. **Efficiency:** Reduce time to create features by 50% through automated workflows
2. **Visibility:** 100% visibility into agent status and project progress
3. **Context Preservation:** Maintain context across agent sessions and projects
4. **Quality:** Ensure all code follows spec → design → implement → review → test → submit workflow

### Success Metrics

- Time from feature creation to PR submission
- Number of manual interventions required per feature
- Agent utilisation rate (agents working vs idle)
- PR review turnaround time
- User satisfaction with workflow automation

---

## Product Requirements

### 1. Project Management

#### 1.1 Project List View
**Priority:** P0 (Must Have)

**Requirements:**
- Display all projects in a card/list view
- Show project metadata:
  - Name
  - Repository URL
  - Active agents count
  - Features in progress
  - Last activity timestamp
- Filter/search projects by name or repository
- Quick actions: "New Project", "New Feature"

**Acceptance Criteria:**
- User can see all projects at a glance
- User can quickly navigate to project details
- User can create new projects from this view

---

#### 1.2 Project Detail View
**Priority:** P0 (Must Have)

**Requirements:**
- Display project information:
  - Repository URL and branch
  - GitHub connection status
  - Active agents working on this project
  - Feature list (with status: planned, in progress, completed, blocked)
- Feature management:
  - Add new feature
  - Edit feature details
  - Delete feature (with confirmation)
  - Reorder features (priority)
- Agent management:
  - List active agents for this project
  - View agent status and current task
  - Stop/restart agents

**Acceptance Criteria:**
- User can manage all features for a project in one place
- User can see which agents are working on what
- User can start new agents from this view

---

### 2. Feature Management

#### 2.1 Feature Creation
**Priority:** P0 (Must Have)

**Requirements:**
- Create feature with:
  - Title
  - Description
  - Priority (high, medium, low)
  - Project assignment
  - Optional: Dependencies on other features
- Feature automatically gets workflow steps:
  1. Specification
  2. Design
  3. Implementation
  4. Review
  5. Testing
  6. Submit (PR)

**Acceptance Criteria:**
- User can create a feature in < 30 seconds
- Feature is automatically assigned to project
- Feature workflow steps are initialised

---

#### 2.2 Feature Workflow View
**Priority:** P0 (Must Have)

**Requirements:**
- Visual workflow progress indicator:
  ```
  [Spec] → [Design] → [Implement] → [Review] → [Test] → [Submit]
  ```
- Each step shows:
  - Status (pending, in progress, completed, blocked)
  - Agent assigned (if any)
  - Last updated timestamp
  - Link to agent conversation/PR
- Click step to:
  - View agent conversation
  - Provide input/feedback
  - Manually mark complete
  - Re-run step with new agent

**Acceptance Criteria:**
- User can see feature progress at a glance
- User can interact with each workflow step
- User can see agent conversations and PRs

---

### 3. Agent Management

#### 3.1 Agent Launch
**Priority:** P0 (Must Have)

**Requirements:**
- Launch agent with:
  - Project selection
  - Feature selection (or "New Feature")
  - Workflow step selection (or "Continue from current step")
  - Model selection (default: Auto)
  - Custom prompt (optional)
- Use Cursor Cloud Agents API: `POST /v0/agents`
- Agent configuration:
  - Repository URL
  - Branch name (auto-generated: `cursor/feature-name-timestamp`)
  - Auto-create PR: enabled by default
  - Skip reviewer request: configurable

**Acceptance Criteria:**
- User can launch agent in < 1 minute
- Agent is created via Cursor API
- Agent appears in active agents list immediately

---

#### 3.2 Agent Status Dashboard
**Priority:** P0 (Must Have)

**Requirements:**
- Real-time agent status display:
  - Agent ID
  - Project/Feature/Step
  - Status (RUNNING, FINISHED, STOPPED, ERROR)
  - Progress indicator
  - Time elapsed
- Actions:
  - View conversation
  - Add follow-up prompt
  - Stop agent
  - Delete agent
- Auto-refresh every 5 seconds (or WebSocket for real-time)

**Acceptance Criteria:**
- User can see all active agents in one view
- Status updates in near real-time
- User can interact with agents without leaving dashboard

---

#### 3.3 Agent Conversation View
**Priority:** P0 (Must Have)

**Requirements:**
- Display full conversation history:
  - User prompts
  - Assistant responses
  - Timestamps
  - Code changes (if applicable)
- Add follow-up prompt:
  - Text input
  - Optional: Image attachments (max 5)
  - Send button
- Link to PR (if created)
- Link to agent status

**Acceptance Criteria:**
- User can see full conversation history
- User can add follow-up prompts easily
- User can navigate to PR for review

---

### 4. Workflow Automation

#### 4.1 Automated Workflow Steps
**Priority:** P0 (Must Have)

**Requirements:**
- Each feature follows this workflow:
  1. **Specification**
     - Agent prompt: "Create a detailed specification for [feature name]: [description]"
     - Output: Specification document (markdown)
     - Completion: User reviews and approves
  2. **Design**
     - Agent prompt: "Based on the specification, create a technical design document for [feature name]"
     - Output: Design document (architecture, components, APIs)
     - Completion: User reviews and approves
  3. **Implementation**
     - Agent prompt: "Implement [feature name] according to the specification and design documents"
     - Output: Code changes in branch
     - Completion: Agent creates PR
  4. **Review**
     - Agent prompt: "Review the PR for [feature name]. Check for: code quality, adherence to spec, test coverage, edge cases"
     - Output: Review comments
     - Completion: User reviews feedback
  5. **Testing**
     - Agent prompt: "Add comprehensive tests for [feature name]. Include unit tests, integration tests, and edge cases"
     - Output: Test code
     - Completion: Tests pass
  6. **Submit**
     - Agent prompt: "Finalise the PR for [feature name]. Ensure all tests pass, documentation is updated, and code is ready for merge"
     - Output: PR ready for merge
     - Completion: User merges PR

**Acceptance Criteria:**
- Each step automatically transitions to next when complete
- User can pause workflow at any step
- User can re-run any step if needed

---

#### 4.2 Workflow Templates
**Priority:** P1 (Should Have)

**Requirements:**
- Pre-defined workflow templates:
  - **Full Workflow:** Spec → Design → Implement → Review → Test → Submit
  - **Quick Feature:** Implement → Review → Submit (skip spec/design)
  - **Bug Fix:** Implement → Test → Submit
  - **Documentation:** Spec → Implement → Review → Submit
- Custom workflow builder:
  - Drag-and-drop workflow steps
  - Define step prompts
  - Save as template

**Acceptance Criteria:**
- User can select workflow template when creating feature
- User can create custom workflows
- Templates are reusable across projects

---

### 5. Prompt Shortcuts

#### 5.1 Shortcut Library
**Priority:** P0 (Must Have)

**Requirements:**
- Pre-defined shortcuts:
  - **Create Spec:** "Create a detailed specification for [feature]. Include: requirements, acceptance criteria, technical constraints, user stories"
  - **Review PR:** "Review this PR thoroughly. Check: code quality, adherence to requirements, test coverage, edge cases, performance, security"
  - **Add Tests:** "Add comprehensive tests for [feature]. Include: unit tests, integration tests, edge cases, error handling"
  - **Refactor:** "Refactor this code to improve: readability, maintainability, performance, following best practices"
  - **Documentation:** "Add/update documentation for [feature]. Include: README updates, code comments, API documentation"
- User-defined shortcuts:
  - Create custom prompt templates
  - Use variables: `{feature}`, `{project}`, `{step}`
  - Save to library

**Acceptance Criteria:**
- User can access shortcuts from any agent conversation
- User can create custom shortcuts
- Shortcuts can be used across projects

---

#### 5.2 Quick Actions
**Priority:** P1 (Should Have)

**Requirements:**
- Quick action buttons in agent conversation:
  - "Create Spec" (uses shortcut)
  - "Review PR" (uses shortcut)
  - "Add Tests" (uses shortcut)
  - "Refactor" (uses shortcut)
- Context-aware: Only show relevant actions based on current step

**Acceptance Criteria:**
- User can trigger common actions with one click
- Actions are contextually relevant

---

### 6. Notifications

#### 6.1 Notification System
**Priority:** P0 (Must Have)

**Requirements:**
- Notification types:
  - **Agent Finished:** Agent completed its task
  - **Agent Needs Input:** Agent is blocked or needs clarification
  - **PR Created:** Agent created a PR
  - **PR Review Ready:** Agent completed review
  - **Workflow Step Complete:** Step completed, next step ready
  - **Error:** Agent encountered an error
- Notification channels:
  - In-app notifications (bell icon)
  - Browser notifications (optional)
  - Email notifications (optional, configurable)
- Notification actions:
  - Click to view agent/conversation/PR
  - Mark as read
  - Dismiss

**Acceptance Criteria:**
- User is notified within 5 seconds of event
- User can act on notifications directly
- User can configure notification preferences

---

#### 6.2 Notification Preferences
**Priority:** P1 (Should Have)

**Requirements:**
- User settings for notifications:
  - Enable/disable notification types
  - Enable/disable channels (in-app, browser, email)
  - Quiet hours
  - Notification frequency (immediate, digest)

**Acceptance Criteria:**
- User can customise notification preferences
- Settings persist across sessions

---

### 7. Context Management

#### 7.1 Project Context
**Priority:** P0 (Must Have)

**Requirements:**
- Store project-level context:
  - Project description
  - Tech stack
  - Coding standards
  - Common patterns
  - Previous decisions
- Context is automatically included in agent prompts
- Context is editable by user

**Acceptance Criteria:**
- Agents have access to project context
- Context improves agent output quality
- User can update context as project evolves

---

#### 7.2 Feature Context
**Priority:** P0 (Must Have)

**Requirements:**
- Store feature-level context:
  - Feature description
  - Specification (from step 1)
  - Design document (from step 2)
  - Previous agent conversations
  - User feedback
- Context is passed to agents working on this feature
- Context accumulates across workflow steps

**Acceptance Criteria:**
- Agents maintain context across workflow steps
- User feedback is preserved
- Agents can reference previous work

---

#### 7.3 Cross-Agent Context
**Priority:** P1 (Should Have)

**Requirements:**
- Share context between agents working on same project:
  - Common patterns discovered
  - Architecture decisions
  - Code style preferences
- Context sharing is automatic
- User can review and approve shared context

**Acceptance Criteria:**
- Agents learn from each other
- Consistent patterns across features
- User maintains control over shared context

---

### 8. PR Management

#### 8.1 PR List View
**Priority:** P0 (Must Have)

**Requirements:**
- Display all PRs created by agents:
  - PR title
  - Feature name
  - Project
  - Status (draft, ready, merged, closed)
  - Agent that created it
  - Created timestamp
- Filter by: project, feature, status
- Quick actions:
  - View PR on GitHub
  - Review in Cursor
  - Merge PR
  - Close PR

**Acceptance Criteria:**
- User can see all agent-created PRs
- User can navigate to PRs easily
- User can manage PRs from UI

---

#### 8.2 PR Review Integration
**Priority:** P0 (Must Have)

**Requirements:**
- Link to PR from feature workflow
- Display PR status in workflow view
- Agent review comments visible in UI
- User can provide feedback to agent about PR
- Agent can update PR based on feedback

**Acceptance Criteria:**
- User can review PRs without leaving UI
- User can provide feedback to agents about PRs
- Agents can iterate on PRs based on feedback

---

### 9. User Interface

#### 9.1 Design Principles
**Priority:** P0 (Must Have)

**Requirements:**
- Clean, modern interface
- Responsive design (desktop-first, mobile-friendly)
- Dark mode support
- Accessible (WCAG 2.1 AA)
- Fast loading (< 2s initial load)
- Smooth animations and transitions

**Acceptance Criteria:**
- UI is intuitive and easy to navigate
- UI works on desktop and mobile
- UI is accessible to all users

---

#### 9.2 Navigation
**Priority:** P0 (Must Have)

**Requirements:**
- Main navigation:
  - Dashboard (home)
  - Projects
  - Agents
  - PRs
  - Shortcuts
  - Settings
- Breadcrumbs for deep navigation
- Search (global, across projects/features/agents)

**Acceptance Criteria:**
- User can navigate easily
- User can find anything in < 3 clicks
- Search is fast and accurate

---

### 10. Technical Requirements

#### 10.1 API Integration
**Priority:** P0 (Must Have)

**Requirements:**
- Integrate with Cursor Cloud Agents API:
  - Authentication (Basic Auth with API key)
  - List agents: `GET /v0/agents`
  - Agent status: `GET /v0/agents/{id}`
  - Agent conversation: `GET /v0/agents/{id}/conversation`
  - Launch agent: `POST /v0/agents`
  - Add follow-up: `POST /v0/agents/{id}/followup`
  - Stop agent: `POST /v0/agents/{id}/stop`
  - Delete agent: `DELETE /v0/agents/{id}`
  - List repositories: `GET /v0/repositories`
  - List models: `GET /v0/models`
- Handle API errors gracefully
- Implement rate limiting (respect Cursor API limits)
- Retry logic for transient failures

**Acceptance Criteria:**
- All Cursor API endpoints are integrated
- API errors are handled gracefully
- Rate limits are respected

---

#### 10.2 Data Storage
**Priority:** P0 (Must Have)

**Requirements:**
- Store:
  - Projects
  - Features
  - Workflow steps
  - Agent history
  - Context (project, feature)
  - Prompt shortcuts
  - User preferences
- Database: PostgreSQL (recommended) or SQLite (for MVP)
- Data model:
  - Projects (id, name, repository_url, context, created_at, updated_at)
  - Features (id, project_id, title, description, priority, status, created_at, updated_at)
  - WorkflowSteps (id, feature_id, step_type, status, agent_id, output, created_at, updated_at)
  - Agents (id, cursor_agent_id, project_id, feature_id, step_id, status, created_at, updated_at)
  - Context (id, project_id, feature_id, content, type, created_at, updated_at)
  - Shortcuts (id, name, prompt_template, user_id, created_at, updated_at)

**Acceptance Criteria:**
- Data persists across sessions
- Data is queryable and filterable
- Data model supports all features

---

#### 10.3 Authentication & Security
**Priority:** P0 (Must Have)

**Requirements:**
- User authentication:
  - Simple auth for MVP (API key storage)
  - OAuth for production (GitHub, Google)
- API key management:
  - Secure storage (encrypted)
  - Key rotation support
- Security:
  - HTTPS only
  - Input validation
  - SQL injection prevention
  - XSS prevention
  - CSRF protection

**Acceptance Criteria:**
- User can securely authenticate
- API keys are stored securely
- Application is secure against common attacks

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)
**Goal:** Core functionality for managing agents and features

**Features:**
- Project list and detail views
- Feature creation and workflow view
- Agent launch and status dashboard
- Basic notifications (in-app only)
- Cursor API integration
- Simple authentication

**Deliverables:**
- Working web application
- Basic UI/UX
- Core agent management
- Feature workflow (manual step transitions)

---

### Phase 2: Workflow Automation (Weeks 5-8)
**Goal:** Automated workflow orchestration

**Features:**
- Automated workflow steps
- Workflow templates
- Context management (project and feature)
- PR management integration
- Enhanced notifications

**Deliverables:**
- Automated workflow execution
- Context preservation
- PR creation and review

---

### Phase 3: Advanced Features (Weeks 9-12)
**Goal:** Productivity enhancements

**Features:**
- Prompt shortcuts library
- Quick actions
- Cross-agent context sharing
- Notification preferences
- Advanced search and filtering

**Deliverables:**
- Productivity features
- Enhanced user experience
- Customisable workflows

---

### Phase 4: Polish & Scale (Weeks 13-16)
**Goal:** Production readiness

**Features:**
- Performance optimisation
- Error handling improvements
- UI/UX polish
- Documentation
- Deployment and monitoring

**Deliverables:**
- Production-ready application
- Documentation
- Monitoring and analytics

---

## Technical Stack Recommendations

### Frontend
- **Framework:** React or Next.js
- **UI Library:** Tailwind CSS + shadcn/ui or Material-UI
- **State Management:** Zustand or Redux Toolkit
- **API Client:** React Query or SWR
- **Real-time:** WebSockets (Socket.io) or Server-Sent Events

### Backend
- **Framework:** Node.js (Express) or Python (FastAPI)
- **Database:** PostgreSQL
- **ORM:** Prisma (Node.js) or SQLAlchemy (Python)
- **API:** REST API (GraphQL optional for Phase 3+)

### Infrastructure
- **Hosting:** Vercel (frontend) + Railway/Render (backend)
- **Database:** Supabase or Railway PostgreSQL
- **Monitoring:** Sentry for error tracking
- **Analytics:** PostHog or Plausible

---

## Open Questions

1. **Multi-user support:** Should this support multiple users/teams, or single-user only?
2. **Agent limits:** How many concurrent agents should be supported?
3. **Cost management:** Should there be cost tracking per agent/project?
4. **GitHub integration:** Should we integrate directly with GitHub API for PR management?
5. **Workflow customisation:** How much customisation should users have over workflow steps?

---

## Success Criteria

### MVP Success
- User can create projects and features
- User can launch agents and see their status
- User can complete a full feature workflow (spec → PR)
- User receives notifications for agent events

### Long-term Success
- 50% reduction in time to create features
- 90% of features follow automated workflow
- User satisfaction score > 4.5/5
- < 5% error rate in agent workflows

---

## References

- [Cursor Cloud Agents API Documentation](https://cursor.com/docs/cloud-agent/api/endpoints)
- Specification-Driven Development (SDD) principles
- Gas Town concepts (simplified for web UI)

---

## Appendix: API Integration Details

### Cursor API Endpoints Used

1. **List Agents:** `GET /v0/agents`
   - Used for: Agent status dashboard
   - Rate limit: Standard API limits

2. **Agent Status:** `GET /v0/agents/{id}`
   - Used for: Real-time status updates
   - Polling: Every 5 seconds (or WebSocket if available)

3. **Agent Conversation:** `GET /v0/agents/{id}/conversation`
   - Used for: Displaying conversation history
   - Caching: Cache conversations, refresh on demand

4. **Launch Agent:** `POST /v0/agents`
   - Used for: Creating new agents
   - Required fields: repository, prompt, target.branchName

5. **Add Follow-up:** `POST /v0/agents/{id}/followup`
   - Used for: Sending prompts to agents
   - Supports: Text and images (max 5)

6. **Stop Agent:** `POST /v0/agents/{id}/stop`
   - Used for: Stopping running agents

7. **Delete Agent:** `DELETE /v0/agents/{id}`
   - Used for: Cleaning up finished agents

8. **List Repositories:** `GET /v0/repositories`
   - Used for: Project repository selection
   - Rate limit: 1/user/minute, 30/user/hour (very strict)

9. **List Models:** `GET /v0/models`
   - Used for: Model selection when launching agents

---

## Next Steps

1. **Review PRD** - Get feedback and refine requirements
2. **Technical Design** - Create technical architecture document
3. **Prototype** - Build simple prototype to validate approach
4. **Development** - Begin Phase 1 implementation
5. **Testing** - User testing and iteration

