'use client';

import { useState, useEffect } from 'react';
import { Shortcut, CreateShortcutInput, UpdateShortcutInput, SHORTCUT_VARIABLES, extractVariables } from '@/lib/shortcuts/types';
import { createShortcut, updateShortcut } from '@/lib/shortcuts/client';

interface ShortcutFormProps {
  shortcut?: Shortcut;
  onSave: (shortcut: Shortcut) => void;
  onCancel: () => void;
}

export default function ShortcutForm({
  shortcut,
  onSave,
  onCancel,
}: ShortcutFormProps) {
  const [name, setName] = useState(shortcut?.name || '');
  const [promptTemplate, setPromptTemplate] = useState(shortcut?.promptTemplate || '');
  const [category, setCategory] = useState(shortcut?.category || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!shortcut;
  const detectedVariables = extractVariables(promptTemplate);

  useEffect(() => {
    if (shortcut) {
      setName(shortcut.name);
      setPromptTemplate(shortcut.promptTemplate);
      setCategory(shortcut.category || '');
    }
  }, [shortcut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const input: UpdateShortcutInput = {
          name,
          promptTemplate,
          category: category || null,
        };
        const updated = await updateShortcut(shortcut.id, input);
        onSave(updated);
      } else {
        const input: CreateShortcutInput = {
          name,
          promptTemplate,
          category: category || null,
        };
        const created = await createShortcut(input);
        onSave(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shortcut');
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('prompt-template') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = promptTemplate;
      const before = text.substring(0, start);
      const after = text.substring(end);
      setPromptTemplate(before + variable + after);
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setPromptTemplate(promptTemplate + variable);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Name field */}
      <div>
        <label
          htmlFor="shortcut-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="shortcut-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Create Spec"
        />
      </div>

      {/* Category field */}
      <div>
        <label
          htmlFor="shortcut-category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Category (optional)
        </label>
        <input
          id="shortcut-category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Specification, Testing"
        />
      </div>

      {/* Prompt template field */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="prompt-template"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prompt Template <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1">
            {Object.values(SHORTCUT_VARIABLES).map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                className="px-2 py-1 text-xs font-mono bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                title={`Insert ${variable}`}
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="prompt-template"
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          required
          rows={6}
          maxLength={10000}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Enter your prompt template. Use variables like {feature}, {project}, {step}, {description}"
        />
        {detectedVariables.length > 0 && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Detected variables: {detectedVariables.map((v) => `{${v}}`).join(', ')}
          </p>
        )}
      </div>

      {/* Available variables hint */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          Available Variables:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <code className="text-purple-800 dark:text-purple-200">{SHORTCUT_VARIABLES.FEATURE}</code>
            <span className="text-blue-700 dark:text-blue-300 ml-2">Feature name</span>
          </div>
          <div>
            <code className="text-purple-800 dark:text-purple-200">{SHORTCUT_VARIABLES.PROJECT}</code>
            <span className="text-blue-700 dark:text-blue-300 ml-2">Project name</span>
          </div>
          <div>
            <code className="text-purple-800 dark:text-purple-200">{SHORTCUT_VARIABLES.STEP}</code>
            <span className="text-blue-700 dark:text-blue-300 ml-2">Workflow step</span>
          </div>
          <div>
            <code className="text-purple-800 dark:text-purple-200">{SHORTCUT_VARIABLES.DESCRIPTION}</code>
            <span className="text-blue-700 dark:text-blue-300 ml-2">Feature description</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name || !promptTemplate}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

