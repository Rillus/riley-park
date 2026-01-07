# Feature 014: Integration Tasks (Parallel Development)

**Priority:** P0 (Must Have)  
**Status:** Not Started  
**Estimated Time:** 2 days

## Overview

This document contains integration tasks extracted from Features 009-012 to prevent merge conflicts when developing these features in parallel. These tasks involve modifying shared components that multiple features need to update.

## Purpose

When Features 009-012 are developed in parallel, they will conflict on shared components. This document extracts those conflicting integration points into separate, sequential dev tasks that should be completed after the core feature work is done.

## Integration Tasks

### Task 14.1: Agent Launch Form Integration (2 hours)

**Conflicts:** Feature 009 (context preview) + Feature 011 (shortcut selector)

**Components Affected:**
- `components/agent/LaunchAgentForm.tsx`
- `components/agent/LaunchAgentModal.tsx`

**Requirements:**
- Integrate context preview from Feature 009
- Integrate shortcut selector from Feature 011
- Ensure both features work together harmoniously
- Add context preview section before prompt input
- Add shortcut selector/buttons above prompt input
- Allow user to select shortcut, which fills prompt and shows context preview

**Dependencies:**
- Feature 009: Context Management (core functionality)
- Feature 011: Prompt Shortcuts (core functionality)

**Acceptance Criteria:**
- [ ] Context preview is displayed in agent launch form
- [ ] Shortcut selector is available in agent launch form
- [ ] Shortcuts can be selected and expanded
- [ ] Context is shown before launching agent
- [ ] Both features work together without conflicts

---

### Task 14.2: Workflow Step Component Integration (3 hours)

**Conflicts:** Feature 009 (context display) + Feature 010 (PR display) + Feature 011 (shortcuts)

**Components Affected:**
- `components/workflow/WorkflowStepCard.tsx`
- `components/workflow/WorkflowStepActions.tsx`
- `components/features/FeatureDetail.tsx` (workflow steps section)

**Requirements:**
- Display PR link and status in workflow step (Feature 010)
- Display context-aware shortcuts in workflow step (Feature 011)
- Display feature context in workflow view (Feature 009)
- Ensure all three features integrate cleanly
- Add PR badge/link to step card
- Add context-aware shortcut buttons to step actions
- Show relevant context when viewing step details

**Dependencies:**
- Feature 009: Context Management (core functionality)
- Feature 010: PR Management (core functionality)
- Feature 011: Prompt Shortcuts (core functionality)

**Acceptance Criteria:**
- [ ] PR information is displayed in workflow steps
- [ ] Context-aware shortcuts are shown in workflow steps
- [ ] Feature context is accessible from workflow view
- [ ] All three features work together without conflicts
- [ ] UI is clean and not cluttered

---

### Task 14.3: Feature Detail View Integration (2 hours)

**Conflicts:** Feature 009 (context display) + Feature 010 (PR list)

**Components Affected:**
- `components/features/FeatureDetail.tsx`

**Requirements:**
- Add feature context section to feature detail view (Feature 009)
- Add PR list section to feature detail view (Feature 010)
- Ensure both sections display properly
- Add tabs or sections for context and PRs

**Dependencies:**
- Feature 009: Context Management (core functionality)
- Feature 010: PR Management (core functionality)

**Acceptance Criteria:**
- [ ] Feature context is displayed in feature detail view
- [ ] PR list is displayed in feature detail view
- [ ] Both sections are accessible and well-organised
- [ ] No UI conflicts or layout issues

---

### Task 14.4: Project Detail View Integration (1 hour)

**Conflicts:** Feature 009 (context display)

**Components Affected:**
- `components/projects/ProjectDetail.tsx`

**Requirements:**
- Add project context section to project detail view (Feature 009)
- Display context editor/viewer
- Ensure it integrates with existing project information display

**Dependencies:**
- Feature 009: Context Management (core functionality)

**Acceptance Criteria:**
- [ ] Project context is displayed in project detail view
- [ ] Context can be edited from project detail view
- [ ] Context section is well-integrated with existing UI

---

### Task 14.5: Navigation Integration (2 hours)

**Conflicts:** Feature 010 (PRs nav) + Feature 011 (Shortcuts nav) + Feature 012 (navigation foundation)

**Components Affected:**
- Layout components (created by Feature 012)
- Navigation menu

**Requirements:**
- Add "PRs" navigation item (Feature 010)
- Add "Shortcuts" navigation item (Feature 011)
- Ensure navigation is consistent with Feature 012 design system
- Add routes for PR list and Shortcuts library

**Dependencies:**
- Feature 010: PR Management (core functionality)
- Feature 011: Prompt Shortcuts (core functionality)
- Feature 012: UI Foundation (navigation system)

**Acceptance Criteria:**
- [ ] PRs link is in navigation menu
- [ ] Shortcuts link is in navigation menu
- [ ] Navigation is consistent with design system
- [ ] Routes are properly configured

---

### Task 14.6: Conversation View Integration (1 hour)

**Conflicts:** Feature 011 (shortcut quick actions)

**Components Affected:**
- `components/conversation/ConversationView.tsx`

**Requirements:**
- Add quick action buttons for shortcuts in conversation view (Feature 011)
- Display relevant shortcuts based on context
- Allow user to insert shortcut into prompt input

**Dependencies:**
- Feature 011: Prompt Shortcuts (core functionality)

**Acceptance Criteria:**
- [ ] Shortcut quick actions are available in conversation view
- [ ] Shortcuts can be inserted into prompt input
- [ ] Context-aware shortcuts are shown appropriately

---

## Development Workflow

### Recommended Approach

1. **Phase 1: Core Feature Development (Parallel)**
   - Develop Features 009-012 in parallel, but **exclude** the integration subtasks listed above
   - Each feature should work independently with its own API endpoints, database tables, and isolated UI components

2. **Phase 2: Integration Tasks (Sequential)**
   - Complete integration tasks 14.1-14.6 sequentially
   - Each task integrates the completed features together
   - Test thoroughly after each integration task

### Subtask Modifications

The following subtasks should be **removed or modified** in the original feature documents:

**Feature 009:**
- Subtask 9.3: Project Context UI - Remove integration with ProjectDetail (move to 14.4)
- Subtask 9.4: Feature Context UI - Remove integration with FeatureDetail (move to 14.3)
- Subtask 9.7: Integration & Polish - Remove agent launch integration (move to 14.1), remove workflow integration (move to 14.2)

**Feature 010:**
- Subtask 10.4: PR List View - Keep standalone PR list page
- Subtask 10.5: PR Detail View - Keep standalone PR detail page
- Subtask 10.6: PR in Workflow View - Move to 14.2
- Subtask 10.8: Integration & Polish - Remove navigation integration (move to 14.5), remove workflow integration (move to 14.2)

**Feature 011:**
- Subtask 11.4: Shortcut Library UI - Keep standalone shortcuts page
- Subtask 11.6: Shortcut Integration - Split into:
  - Agent launch integration → Move to 14.1
  - Workflow step integration → Move to 14.2
  - Conversation view integration → Move to 14.6
- Subtask 11.7: Polish & UX - Remove navigation integration (move to 14.5)

**Feature 012:**
- Subtask 12.3: Navigation System - Create base navigation, but note that PRs and Shortcuts links will be added in 14.5

## Notes

- These integration tasks should be completed **after** the core features are done
- Each integration task is designed to be independent and can be tested separately
- The integration tasks ensure that all features work together harmoniously
- Consider creating feature flags if needed to enable/disable features during development

