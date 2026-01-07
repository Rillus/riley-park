/**
 * Tests for FeatureSyncButton component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeatureSyncButton from '../FeatureSyncButton';
import { syncFeaturesFromRepository, getFeatureSyncStatus } from '@/lib/features';

// Mock the client functions
jest.mock('@/lib/features', () => ({
  syncFeaturesFromRepository: jest.fn(),
  getFeatureSyncStatus: jest.fn(),
}));

const mockSyncFeatures = syncFeaturesFromRepository as jest.MockedFunction<typeof syncFeaturesFromRepository>;
const mockGetSyncStatus = getFeatureSyncStatus as jest.MockedFunction<typeof getFeatureSyncStatus>;

describe('FeatureSyncButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for sync status
    mockGetSyncStatus.mockResolvedValue({
      lastSyncedAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
      hasGitHubToken: true,
    });
  });

  it('renders sync button', async () => {
    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync features/i })).toBeInTheDocument();
    });
  });

  it('shows "Never synced" when no sync has occurred', async () => {
    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByText(/never synced/i)).toBeInTheDocument();
    });
  });

  it('shows last sync time when available', async () => {
    mockGetSyncStatus.mockResolvedValue({
      lastSyncedAt: '2026-01-07T12:00:00Z',
      lastSyncStatus: 'success',
      lastSyncError: null,
      hasGitHubToken: true,
    });

    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByText(/last synced:/i)).toBeInTheDocument();
    });
  });

  it('shows warning when GitHub token is not configured', async () => {
    mockGetSyncStatus.mockResolvedValue({
      lastSyncedAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
      hasGitHubToken: false,
    });

    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByText(/no github token configured/i)).toBeInTheDocument();
    });
  });

  it('triggers sync when button is clicked', async () => {
    mockSyncFeatures.mockResolvedValue({
      success: true,
      synced: 2,
      created: 1,
      updated: 1,
      errors: [],
      message: 'Successfully synced 2 features',
    });

    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync features/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sync features/i }));

    await waitFor(() => {
      expect(mockSyncFeatures).toHaveBeenCalledWith('test-project');
    });
  });

  it('shows success toast after successful sync', async () => {
    mockSyncFeatures.mockResolvedValue({
      success: true,
      synced: 2,
      created: 1,
      updated: 1,
      errors: [],
      message: 'Successfully synced 2 features',
    });

    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync features/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sync features/i }));

    await waitFor(() => {
      expect(screen.getByText(/features synced/i)).toBeInTheDocument();
    });
  });

  it('shows error toast after failed sync', async () => {
    mockSyncFeatures.mockResolvedValue({
      success: false,
      synced: 0,
      created: 0,
      updated: 0,
      errors: ['Repository not found'],
      message: 'Failed to sync features',
    });

    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync features/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sync features/i }));

    await waitFor(() => {
      expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
    });
  });

  it('disables button while syncing', async () => {
    // Make sync take a while
    mockSyncFeatures.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({
      success: true,
      synced: 1,
      created: 1,
      updated: 0,
      errors: [],
      message: 'Success',
    }), 100)));

    render(<FeatureSyncButton projectId="test-project" />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync features/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sync features/i }));

    // Button should show "Syncing..."
    expect(screen.getByRole('button', { name: /syncing/i })).toBeDisabled();
  });

  it('calls onSyncComplete callback when sync finishes', async () => {
    const onSyncComplete = jest.fn();
    const syncResult = {
      success: true,
      synced: 1,
      created: 1,
      updated: 0,
      errors: [],
      message: 'Success',
    };
    mockSyncFeatures.mockResolvedValue(syncResult);

    render(<FeatureSyncButton projectId="test-project" onSyncComplete={onSyncComplete} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync features/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sync features/i }));

    await waitFor(() => {
      expect(onSyncComplete).toHaveBeenCalledWith(syncResult);
    });
  });
});
