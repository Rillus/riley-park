# Feature 013: Pull Features from Project Repository

**Priority:** P1 (High)  
**Status:** ✅ Completed  
**Estimated Time:** 1 day

## Overview

When a project is added to Riley Park, automatically discover and import feature specifications from the project's `docs/features` folder. This allows teams to manage their feature specifications in their own repositories and have them automatically synced into Riley Park for workflow management and agent integration.

## Requirements

### 1. Feature Discovery
- When a project is created or updated, scan the repository's `docs/features` folder
- Support reading from the project's default branch (configurable per project)
- Parse markdown files matching the pattern: `XXX-feature-name.md` or `XXX-feature-name.md`
- Extract metadata from feature files:
  - Feature ID (from filename: `001`, `001b`, `002`, etc.)
  - Title (from H1 heading)
  - Priority (from `**Priority:**` field)
  - Status (from `**Status:**` field)
  - Estimated Time (from `**Estimated Time:**` field)
  - Full markdown content

### 2. Feature Import/Sync
- Create or update features in the database based on discovered files
- Match features by:
  - Project ID + Feature ID (from filename) as unique identifier
  - If feature exists, update it; if not, create it
- Preserve existing workflow steps and status when updating
- Set initial status to "planned" if not specified in the markdown
- Set priority to "medium" if not specified in the markdown

### 3. API Endpoints

#### POST /api/projects/:id/sync-features
- Triggers a manual sync of features from the project repository
- Returns:
  - `synced`: number of features synced
  - `created`: number of new features created
  - `updated`: number of existing features updated
  - `errors`: array of any errors encountered
- Handles:
  - Repository access errors (private repos, auth issues)
  - Invalid file format errors
  - Network timeouts

#### GET /api/projects/:id/features/sync-status
- Returns the last sync timestamp and status
- Useful for displaying sync information in the UI

### 4. Automatic Sync (Optional - Future Enhancement)
- Background job to periodically sync features from repositories
- Configurable sync interval per project
- Only sync if repository has been updated since last sync

## Technical Requirements

### 1. Repository Access
- Use GitHub API to read files from repository
- Support both public and private repositories (requires GitHub token)
- Handle rate limiting gracefully
- Cache repository contents to avoid excessive API calls

### 2. File Parsing
- Reuse existing `parseFeatureMetadata` function from `lib/features/parser.ts`
- Enhance parser to handle variations in markdown format
- Extract full markdown content for storage/display

### 3. Database Operations
- Use Prisma transactions to ensure data consistency
- Create workflow steps automatically when creating new features
- Update existing features without losing workflow step progress

### 4. Error Handling
- Log all errors for debugging
- Return user-friendly error messages
- Continue processing other features if one fails
- Track sync errors per project for monitoring

## Data Flow

1. **User Action**: User creates/updates project OR clicks "Sync Features" button
2. **API Call**: `POST /api/projects/:id/sync-features`
3. **Repository Access**: 
   - Fetch repository tree from GitHub API
   - Filter for files in `docs/features/` directory
   - Read each `.md` file (excluding `README.md`)
4. **Parsing**: 
   - Parse each markdown file using `parseFeatureMetadata`
   - Extract feature ID, title, priority, status, etc.
5. **Database Sync**:
   - For each feature:
     - Check if feature exists (by projectId + featureId)
     - If exists: Update title, description, priority, status (preserve workflow steps)
     - If not: Create new feature with all workflow steps
6. **Response**: Return sync results to client

## Subtasks

### Subtask 1: GitHub API Integration (3-4 hours)
- [ ] Create GitHub API client utility
- [ ] Implement repository file fetching
- [ ] Handle authentication (GitHub token from env)
- [ ] Add rate limiting and error handling
- [ ] Write tests for GitHub API integration

**Deliverables:**
- `lib/github/client.ts` - GitHub API client
- Tests for file fetching and error cases

### Subtask 2: Feature Sync Service (3-4 hours)
- [ ] Create `lib/features/sync.ts` service
- [ ] Implement feature discovery logic
- [ ] Implement feature parsing and validation
- [ ] Implement database sync (create/update)
- [ ] Add transaction handling
- [ ] Write tests for sync logic

**Deliverables:**
- `lib/features/sync.ts` - Sync service
- Tests for sync operations

### Subtask 3: API Endpoints (2-3 hours)
- [ ] Create `POST /api/projects/:id/sync-features` endpoint
- [ ] Create `GET /api/projects/:id/features/sync-status` endpoint
- [ ] Add request validation
- [ ] Add error handling and logging
- [ ] Write API route tests

**Deliverables:**
- `app/api/projects/[id]/sync-features/route.ts`
- `app/api/projects/[id]/features/sync-status/route.ts`
- Tests for API endpoints

### Subtask 4: UI Integration (2-3 hours)
- [ ] Add "Sync Features" button to project detail page
- [ ] Show sync status and last sync time
- [ ] Display sync results (toast notification)
- [ ] Handle loading states
- [ ] Show errors if sync fails

**Deliverables:**
- Updated `app/projects/[id]/page.tsx`
- Sync button component
- Toast notifications for sync results

## Dependencies

- Feature 004: Project Management (must be completed)
- Feature 005: Feature Management (must be completed)
- GitHub API access token (environment variable)
- Existing feature parser (`lib/features/parser.ts`)

## Technical Notes

### GitHub API Considerations
- Use Octokit library for GitHub API access
- Store GitHub token in environment variable: `GITHUB_TOKEN`
- Handle both public and private repositories
- Consider using GraphQL API for more efficient file fetching

### Feature ID Matching
- Feature ID is derived from filename: `001-basic-agent-messaging.md` → `001-basic-agent-messaging`
- Use this as a unique identifier per project
- Store in a new `externalId` field or use title as fallback matching

### Workflow Steps
- When creating new features, automatically create all 6 workflow steps
- When updating existing features, preserve workflow step status and progress
- Only update feature metadata (title, description, priority, status)

### Error Recovery
- If sync fails partway through, log which features succeeded
- Allow partial syncs (some features succeed, others fail)
- Return detailed error information for debugging

## Acceptance Criteria

- [x] User can trigger feature sync from project detail page
- [x] Features are discovered from `docs/features` folder in repository
- [x] New features are created with all workflow steps
- [x] Existing features are updated without losing workflow progress
- [x] Sync status is displayed in the UI
- [x] Errors are handled gracefully and displayed to user
- [x] Private repositories work with GitHub token authentication
- [x] Rate limiting is handled appropriately
- [x] All tests pass (unit tests, integration tests)

## Implementation Summary

### Files Created
- `lib/github/client.ts` - GitHub API client using Octokit
- `lib/github/index.ts` - Module exports
- `lib/github/__tests__/client.test.ts` - GitHub client tests
- `lib/features/sync.ts` - Feature sync service
- `lib/features/__tests__/sync.test.ts` - Sync service tests
- `app/api/projects/[id]/sync-features/route.ts` - Sync API endpoint
- `app/api/projects/[id]/features/sync-status/route.ts` - Status API endpoint
- `components/features/FeatureSyncButton.tsx` - Sync button component
- `components/features/__tests__/FeatureSyncButton.test.tsx` - Component tests

### Database Schema Changes
- Added to `Project` model:
  - `lastSyncedAt` - Timestamp of last sync
  - `lastSyncStatus` - Status (success, error, in_progress)
  - `lastSyncError` - Error message if sync failed
- Added to `Feature` model:
  - `externalId` - Feature ID from repository filename
- Added unique constraint on `projectId + externalId`

### Key Implementation Details
- **Priority Mapping**: P0, P1 → high; P2 → medium; P3 → low
- **Status Mapping**: Not Started/Planned → planned; In Progress → in_progress; Completed/Done/✅ → completed; Blocked → blocked
- **Feature ID**: Derived from filename (e.g., `001-basic-agent-messaging.md` → `001-basic-agent-messaging`)
- Uses Prisma transactions for data consistency
- Preserves workflow step progress when updating features
- Continues processing if individual features fail

### Test Coverage
- **GitHub Client Tests**: 17 tests covering URL parsing, file fetching, error handling
- **Sync Service Tests**: 23 tests covering priority/status parsing, sync operations, error recovery
- **UI Component Tests**: 9 tests covering button states, sync flow, callbacks

## Future Enhancements

- Automatic periodic syncing (background jobs)
- Support for GitLab and Bitbucket repositories
- Webhook integration for automatic sync on repository updates
- Sync conflict resolution (when local changes conflict with repository)
- Feature diff view (show what changed since last sync)

