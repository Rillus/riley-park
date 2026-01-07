'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shortcut } from '@/lib/shortcuts/types';
import { fetchShortcuts, deleteShortcut } from '@/lib/shortcuts/client';
import ShortcutCard from './ShortcutCard';

interface ShortcutLibraryProps {
  onUse?: (shortcut: Shortcut) => void;
  onEdit?: (shortcut: Shortcut) => void;
  onCreate?: () => void;
}

export default function ShortcutLibrary({
  onUse,
  onEdit,
  onCreate,
}: ShortcutLibraryProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [groupByCategory, setGroupByCategory] = useState(false);

  const loadShortcuts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchShortcuts({
        category: categoryFilter || undefined,
        search: search || undefined,
      });
      setShortcuts(response.shortcuts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shortcuts');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  const handleDelete = async (shortcut: Shortcut) => {
    if (!confirm(`Are you sure you want to delete "${shortcut.name}"?`)) {
      return;
    }

    try {
      await deleteShortcut(shortcut.id);
      await loadShortcuts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete shortcut');
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(shortcuts.map((s) => s.category).filter((c): c is string => c !== null))
  ).sort();

  // Group shortcuts by category if enabled
  const groupedShortcuts = groupByCategory
    ? categories.reduce((acc, category) => {
        acc[category] = shortcuts.filter((s) => s.category === category);
        return acc;
      }, {} as Record<string, Shortcut[]>)
    : { 'All': shortcuts };

  // Add uncategorised shortcuts
  if (groupByCategory) {
    const uncategorised = shortcuts.filter((s) => !s.category);
    if (uncategorised.length > 0) {
      groupedShortcuts['Uncategorised'] = uncategorised;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading shortcuts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={loadShortcuts}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Prompt Shortcuts
          </h2>
          {!loading && !error && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {shortcuts.length} shortcut{shortcuts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />

          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}

          {/* Group by category toggle */}
          {categories.length > 0 && (
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByCategory}
                onChange={(e) => setGroupByCategory(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Group</span>
            </label>
          )}

          {/* New Shortcut button */}
          {onCreate && (
            <button
              onClick={onCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
            >
              New Shortcut
            </button>
          )}
        </div>
      </div>

      {/* Shortcuts grid */}
      {Object.keys(groupedShortcuts).length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No shortcuts found. {onCreate && 'Create your first shortcut to get started!'}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([groupName, groupShortcuts]) => (
            <div key={groupName}>
              {groupByCategory && (
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {groupName}
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupShortcuts.map((shortcut) => (
                  <ShortcutCard
                    key={shortcut.id}
                    shortcut={shortcut}
                    onUse={onUse}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

