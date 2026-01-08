'use client';

import { useState, useEffect } from 'react';
import { ProjectContext } from '@/lib/context/types';
import { fetchProjectContext, upsertProjectContext } from '@/lib/context/client';

interface ProjectContextEditorProps {
  projectId: string;
  onSave?: (context: ProjectContext) => void;
  onCancel?: () => void;
}

export default function ProjectContextEditor({
  projectId,
  onSave,
  onCancel,
}: ProjectContextEditorProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing context
  useEffect(() => {
    async function loadContext() {
      try {
        setLoading(true);
        const context = await fetchProjectContext(projectId);
        if (context) {
          setContent(context.content);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load context');
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const context = await upsertProjectContext(projectId, { content });
      if (onSave) {
        onSave(context);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save context');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500 dark:text-gray-400">Loading context...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="context-content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Project Context
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Add project-level context such as tech stack, coding standards, architecture notes, and common patterns. This context will be included in agent prompts.
        </p>
        <textarea
          id="context-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="## Tech Stack&#10;&#10;- React 19&#10;- Next.js 16&#10;- TypeScript&#10;&#10;## Coding Standards&#10;&#10;- Use TDD approach&#10;- Follow British English spelling&#10;- Use functional components..."
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          {saving ? 'Saving...' : 'Save Context'}
        </button>
      </div>
    </form>
  );
}

