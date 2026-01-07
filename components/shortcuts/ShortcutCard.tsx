'use client';

import { Shortcut } from '@/lib/shortcuts/types';
import { extractVariables } from '@/lib/shortcuts/types';

interface ShortcutCardProps {
  shortcut: Shortcut;
  onUse?: (shortcut: Shortcut) => void;
  onEdit?: (shortcut: Shortcut) => void;
  onDelete?: (shortcut: Shortcut) => void;
}

export default function ShortcutCard({
  shortcut,
  onUse,
  onEdit,
  onDelete,
}: ShortcutCardProps) {
  const variables = shortcut.variables ? JSON.parse(shortcut.variables) : [];
  const hasVariables = variables.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {shortcut.name}
            </h3>
            {shortcut.isPredefined && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                Predefined
              </span>
            )}
            {shortcut.category && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {shortcut.category}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {shortcut.promptTemplate}
          </p>

          {hasVariables && (
            <div className="flex flex-wrap gap-1 mb-3">
              {variables.map((variable: string) => (
                <span
                  key={variable}
                  className="px-2 py-0.5 text-xs font-mono bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded"
                >
                  {'{' + variable + '}'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {onUse && (
          <button
            onClick={() => onUse(shortcut)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Use
          </button>
        )}
        {onEdit && !shortcut.isPredefined && (
          <button
            onClick={() => onEdit(shortcut)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Edit
          </button>
        )}
        {onDelete && !shortcut.isPredefined && (
          <button
            onClick={() => onDelete(shortcut)}
            className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

