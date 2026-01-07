/**
 * React hooks for shortcuts
 */

import { useState, useCallback } from 'react';
import { ExpandShortcutInput } from './types';
import { expandShortcut as expandShortcutAPI } from './client';
import { expandShortcut as expandShortcutLocal } from './expansion';

/**
 * Hook for expanding shortcuts with variables
 * Can use either API or local expansion
 */
export function useShortcutExpansion(useAPI = false) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expand = useCallback(
    async (shortcutId: string, variables: ExpandShortcutInput): Promise<string | null> => {
      if (useAPI) {
        setLoading(true);
        setError(null);
        try {
          const result = await expandShortcutAPI(shortcutId, variables);
          return result;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to expand shortcut');
          return null;
        } finally {
          setLoading(false);
        }
      } else {
        // For local expansion, we need the template - this is a simplified version
        // In practice, you'd pass the template or fetch it
        setError('Local expansion requires template. Use expandShortcutLocal directly.');
        return null;
      }
    },
    [useAPI]
  );

  return { expand, loading, error };
}

/**
 * Utility function to expand a shortcut template locally (client-side)
 * Useful when you already have the template and don't need to call the API
 */
export function useLocalShortcutExpansion() {
  return useCallback(
    (template: string, variables: ExpandShortcutInput): string => {
      return expandShortcutLocal(template, variables);
    },
    []
  );
}

