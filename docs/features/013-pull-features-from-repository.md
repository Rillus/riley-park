# Feature 013: Pull Features from Project Repository

**Priority:** P1 (High)  
**Status:** ✅ Completed  
**Estimated Time:** 1 day

## Overview

When a project is added to Riley Park, users can discover and import feature specifications from the project's `docs/features` folder. This allows teams to manage their feature specifications in their own repositories and have them automatically synced into Riley Park for workflow management and agent integration.

## Implementation Summary

### 1. GitHub API Integration (`lib/github/client.ts`)
- Created `GitHubClient` class using Octokit for GitHub API access
- Implemented `parseRepositoryUrl()` to extract owner/repo from GitHub URLs (HTTPS and SSH)
- Implemented `getFeatureFiles()` to list feature files in `docs/features` directory
- Implemented `getFileContent()` to fetch file content
- Implemented `getFeatureFilesWithContent()` to get all features with content
- Custom `GitHubApiError` class for error handling
- Support for GitHub token authentication via `GITHUB_TOKEN` environment variable

### 2. Feature Sync Service (`lib/features/sync.ts`)
- Created `FeatureSyncService` class for syncing features
- Implemented `parsePriorityFromMarkdown()` to convert priority strings (P0-P3) to database format
- Implemented `parseStatusFromMarkdown()` to convert status strings to database format
- Implemented `syncFeatures()` to orchestrate the sync process
- Uses Prisma transactions for data consistency
- Creates workflow steps automatically for new features
- Preserves existing workflow progress when updating features
- Continues processing if individual features fail

### 3. API Endpoints

#### POST /api/projects/:id/sync-features
- Triggers manual sync of features from repository
- Returns sync results (synced, created, updated, errors)
- Handles various error types (rate limiting, auth, not found)

#### GET /api/projects/:id/features/sync-status
- Returns last sync timestamp and status
- Indicates if GitHub token is configured

### 4. Database Schema Changes
- Added to `Project` model:
  - `lastSyncedAt` - Timestamp of last sync
  - `lastSyncStatus` - Status (success, error, in_progress)
  - `lastSyncError` - Error message if sync failed
- Added to `Feature` model:
  - `externalId` - Feature ID from repository filename
- Added unique constraint on `projectId + externalId`

### 5. UI Integration (`components/features/FeatureSyncButton.tsx`)
- Sync button with loading state
- Displays last sync time and status
- Shows GitHub token warning if not configured
- Toast notifications for sync results
- Automatic refresh of features after sync

## Technical Details

### Feature ID Matching
Feature ID is derived from filename: `001-basic-agent-messaging.md` → `001-basic-agent-messaging`

### Priority Mapping
- P0, P1 → high
- P2 → medium
- P3 → low

### Status Mapping
- Not Started, Planned → planned
- In Progress → in_progress
- Completed, Done, ✅ → completed
- Blocked → blocked

## Files Created/Modified

### New Files
- `lib/github/client.ts` - GitHub API client
- `lib/github/index.ts` - Module exports
- `lib/github/__tests__/client.test.ts` - GitHub client tests
- `lib/features/sync.ts` - Feature sync service
- `lib/features/__tests__/sync.test.ts` - Sync service tests
- `app/api/projects/[id]/sync-features/route.ts` - Sync API endpoint
- `app/api/projects/[id]/features/sync-status/route.ts` - Status API endpoint
- `components/features/FeatureSyncButton.tsx` - Sync button component
- `components/features/__tests__/FeatureSyncButton.test.tsx` - Component tests
- `prisma/migrations/20260107130000_add_feature_sync/migration.sql` - Database migration

### Modified Files
- `prisma/schema.prisma` - Added sync fields
- `jest.config.js` - Added Octokit to transform ignore
- `lib/features/index.ts` - Added sync exports
- `lib/features/client.ts` - Added sync client functions
- `lib/features/types.ts` - Added externalId to Feature type
- `lib/projects/types.ts` - Added sync fields to Project type
- `components/features/index.ts` - Added FeatureSyncButton export
- `components/projects/ProjectDetail.tsx` - Added sync button to UI
- `package.json` - Added @octokit/rest dependency

## Test Coverage

- **GitHub Client Tests**: 17 tests covering URL parsing, file fetching, error handling
- **Sync Service Tests**: 23 tests covering priority/status parsing, sync operations, error recovery
- **UI Component Tests**: 9 tests covering button states, sync flow, callbacks

## Environment Variables

- `GITHUB_TOKEN` - Optional GitHub personal access token for private repository access

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
