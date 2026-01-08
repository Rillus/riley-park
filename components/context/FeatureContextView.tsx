'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import {
  FeatureContext,
  FeatureContextGrouped,
  FeatureContextType,
} from '@/lib/context/types';
import {
  fetchFeatureContextGrouped,
  createFeatureContext,
} from '@/lib/context/client';

interface FeatureContextViewProps {
  featureId: string;
  onAddNote?: () => void;
}

const CONTEXT_TYPE_LABELS: Record<FeatureContextType, string> = {
  description: 'Feature Description',
  spec: 'Specification',
  design: 'Design Document',
  notes: 'Additional Notes',
  feedback: 'Feedback',
};

export default function FeatureContextView({
  featureId,
  onAddNote,
}: FeatureContextViewProps) {
  const [contexts, setContexts] = useState<FeatureContextGrouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Load contexts
  useEffect(() => {
    async function loadContexts() {
      try {
        setLoading(true);
        const data = await fetchFeatureContextGrouped(featureId);
        setContexts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load context');
      } finally {
        setLoading(false);
      }
    }

    loadContexts();
  }, [featureId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await createFeatureContext(featureId, {
        content: noteContent,
        contextType: 'notes',
      });
      setNoteContent('');
      setShowNoteForm(false);
      
      // Reload contexts
      const data = await fetchFeatureContextGrouped(featureId);
      setContexts(data);
      
      if (onAddNote) {
        onAddNote();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!contexts) {
    return null;
  }

  const renderContextSection = (
    type: FeatureContextType,
    context: FeatureContext | FeatureContext[]
  ) => {
    const label = CONTEXT_TYPE_LABELS[type];
    
    if (Array.isArray(context)) {
      // Multiple entries (notes, feedback)
      if (context.length === 0) {
        return null;
      }
      return (
        <div key={type} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {label}
          </h3>
          <div className="space-y-4">
            {context.map((ctx) => (
              <div
                key={ctx.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(ctx.content) as string,
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(ctx.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Single entry (description, spec, design)
      return (
        <div key={type} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {label}
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: marked.parse(context.content) as string,
              }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last updated: {new Date(context.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      {contexts.description && renderContextSection('description', contexts.description)}

      {/* Specification */}
      {contexts.spec && renderContextSection('spec', contexts.spec)}

      {/* Design */}
      {contexts.design && renderContextSection('design', contexts.design)}

      {/* Notes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {CONTEXT_TYPE_LABELS.notes}
          </h3>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {showNoteForm ? 'Cancel' : '+ Add Note'}
          </button>
        </div>

        {showNoteForm && (
          <form onSubmit={handleAddNote} className="mb-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600 mb-2"
              placeholder="Add a note about this feature..."
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNoteForm(false);
                  setNoteContent('');
                }}
                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!noteContent.trim() || saving}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </form>
        )}

        {contexts.notes.length > 0 && (
          <div className="space-y-4">
            {contexts.notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(note.content) as string,
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(note.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback */}
      {contexts.feedback.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {CONTEXT_TYPE_LABELS.feedback}
          </h3>
          <div className="space-y-4">
            {contexts.feedback.map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(feedback.content) as string,
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(feedback.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!contexts.description &&
        !contexts.spec &&
        !contexts.design &&
        contexts.notes.length === 0 &&
        contexts.feedback.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No context available yet.</p>
            <p className="text-sm mt-2">
              Context will be automatically populated from workflow steps.
            </p>
          </div>
        )}
    </div>
  );
}

