'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  syncFeaturesFromRepository, 
  getFeatureSyncStatus,
  FeatureSyncResult, 
  FeatureSyncStatus 
} from '@/lib/features';

interface FeatureSyncButtonProps {
  projectId: string;
  onSyncComplete?: (result: FeatureSyncResult) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

export default function FeatureSyncButton({ projectId, onSyncComplete }: FeatureSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<FeatureSyncStatus | null>(null);
  const [lastResult, setLastResult] = useState<FeatureSyncResult | null>(null);
  const [showToast, setShowToast] = useState(false);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const status = await getFeatureSyncStatus(projectId);
      setSyncStatus(status);
      // Check if currently syncing (in case page was refreshed during sync)
      if (status.lastSyncStatus === 'in_progress') {
        setIsSyncing(true);
        // Poll for status updates
        setTimeout(fetchSyncStatus, 2000);
      } else {
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const handleSync = async () => {
    setIsSyncing(true);
    setLastResult(null);
    
    try {
      const result = await syncFeaturesFromRepository(projectId);
      setLastResult(result);
      setShowToast(true);
      
      // Refresh sync status
      await fetchSyncStatus();
      
      // Notify parent
      onSyncComplete?.(result);
      
      // Hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000);
    } catch (error) {
      console.error('Sync failed:', error);
      setLastResult({
        success: false,
        synced: 0,
        created: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Failed to sync features',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative">
      {/* Sync Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
            ${isSyncing 
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
            }
            transition-colors
          `}
          title="Sync features from repository docs/features folder"
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Features
            </>
          )}
        </button>

        {/* Sync Status Info */}
        {syncStatus && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {syncStatus.lastSyncedAt ? (
              <span>
                Last synced: {formatDate(syncStatus.lastSyncedAt)}
                {syncStatus.lastSyncStatus === 'error' && (
                  <span className="ml-2 text-red-500" title={syncStatus.lastSyncError || ''}>
                    (failed)
                  </span>
                )}
              </span>
            ) : (
              <span>Never synced</span>
            )}
          </div>
        )}
      </div>

      {/* GitHub Token Warning */}
      {syncStatus && !syncStatus.hasGitHubToken && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          ⚠️ No GitHub token configured. Only public repositories will work.
        </p>
      )}

      {/* Toast Notification */}
      {showToast && lastResult && (
        <div 
          className={`
            fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md
            ${lastResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }
          `}
        >
          <div className="flex items-start gap-3">
            {lastResult.success ? (
              <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <div className="flex-1">
              <p className={`font-medium ${lastResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {lastResult.success ? 'Features Synced' : 'Sync Failed'}
              </p>
              <p className={`text-sm mt-1 ${lastResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {lastResult.message}
              </p>
              {lastResult.success && (lastResult.created > 0 || lastResult.updated > 0) && (
                <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                  {lastResult.created > 0 && `${lastResult.created} created`}
                  {lastResult.created > 0 && lastResult.updated > 0 && ', '}
                  {lastResult.updated > 0 && `${lastResult.updated} updated`}
                </p>
              )}
              {lastResult.errors.length > 0 && (
                <ul className="text-xs mt-2 text-red-600 dark:text-red-400 list-disc list-inside">
                  {lastResult.errors.slice(0, 3).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {lastResult.errors.length > 3 && (
                    <li>...and {lastResult.errors.length - 3} more errors</li>
                  )}
                </ul>
              )}
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
