# Feature 004: Project Management

**Priority:** P0 (Must Have)  
**Status:** ✅ Completed  
**Estimated Time:** 2 days

## Overview

Manage projects - create, view, edit, and delete projects. Projects represent repositories and contain features.

## Requirements

### 1. Project List View
- Display all projects in a card/list view
- Show project metadata:
  - Name
  - Repository URL
  - Active agents count
  - Features in progress count
  - Last activity timestamp
- Filter/search projects by name or repository
- Quick actions: "New Project", "View Project"

### 2. Create Project
- Form to create new project:
  - Project name (required)
  - Repository URL (required)
  - Default branch (optional, defaults to "main")
  - Description (optional)
- Validate repository URL format
- Store project in database

### 3. Project Detail View
- Display project information:
  - Repository URL and branch
  - GitHub connection status (if applicable)
  - Active agents working on this project
  - Feature list (with status)
  - Project description
- Actions:
  - Edit project
  - Delete project (with confirmation)
  - Launch agent for this project
  - Create new feature

### 4. Edit Project
- Edit project name, description, branch
- Update repository URL (with validation)
- Save changes to database

### 5. Delete Project
- Delete project with confirmation
- Handle cascade delete of features (or prevent if features exist)
- Remove from database

## Acceptance Criteria

- [ ] User can see all projects at a glance
- [ ] User can create a new project
- [ ] User can view project details
- [ ] User can edit project information
- [ ] User can delete project (with safety checks)
- [ ] Projects are stored persistently

## Technical Requirements

### Data Storage
- Database table: `projects`
  - id (primary key)
  - name (string, required)
  - repository_url (string, required, unique)
  - default_branch (string, default: "main")
  - description (text, optional)
  - created_at (timestamp)
  - updated_at (timestamp)
- Database migrations
- ORM models

### API Endpoints
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### UI Components
- Project list component
- Project card component
- Create project form
- Project detail view
- Edit project form
- Delete confirmation dialog

## Subtasks

### Subtask 4.1: Database Schema & Models (3 hours)
- [ ] Create projects table migration
- [ ] Create Project model/ORM
- [ ] Add validation rules
- [ ] Write tests for model
- [ ] Set up database connection

### Subtask 4.2: Project API Endpoints (4 hours)
- [ ] Create GET /api/projects endpoint
- [ ] Create GET /api/projects/:id endpoint
- [ ] Create POST /api/projects endpoint
- [ ] Create PUT /api/projects/:id endpoint
- [ ] Create DELETE /api/projects/:id endpoint
- [ ] Add input validation
- [ ] Add error handling
- [ ] Write tests for all endpoints

### Subtask 4.3: Project List View (3 hours)
- [ ] Create project list component
- [ ] Create project card component
- [ ] Fetch and display projects
- [ ] Add search/filter functionality
- [ ] Add "New Project" button
- [ ] Add navigation to project details
- [ ] Write tests for components

### Subtask 4.4: Create Project (2 hours)
- [ ] Create project form component
- [ ] Add form validation
- [ ] Integrate with create API
- [ ] Display success/error messages
- [ ] Navigate to project detail after creation
- [ ] Write tests for create flow

### Subtask 4.5: Project Detail View (3 hours)
- [ ] Create project detail component
- [ ] Display project information
- [ ] Show active agents (placeholder for now)
- [ ] Show features list (placeholder for now)
- [ ] Add edit/delete buttons
- [ ] Add "Launch Agent" button (placeholder)
- [ ] Add "Create Feature" button (placeholder)
- [ ] Write tests for component

### Subtask 4.6: Edit & Delete Project (2 hours)
- [ ] Create edit project form
- [ ] Integrate with update API
- [ ] Add delete confirmation dialog
- [ ] Integrate with delete API
- [ ] Handle cascade delete logic
- [ ] Write tests for edit/delete flows

### Subtask 4.7: Integration & Polish (1 hour)
- [ ] Connect all components
- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add basic styling
- [ ] End-to-end testing

## Dependencies

- Database setup (PostgreSQL or SQLite)
- ORM setup (Prisma, SQLAlchemy, etc.)
- Basic authentication (for API security)

## Notes

- This feature establishes the foundation for feature management
- Repository URL validation should check format (GitHub, GitLab, etc.)
- Consider adding repository verification (check if accessible)

