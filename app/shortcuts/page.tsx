'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ShortcutLibrary from '@/components/shortcuts/ShortcutLibrary';
import ShortcutForm from '@/components/shortcuts/ShortcutForm';
import { Shortcut } from '@/lib/shortcuts/types';

type View = 'list' | 'create' | 'edit';

export default function ShortcutsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('list');
  const [selectedShortcut, setSelectedShortcut] = useState<Shortcut | null>(null);

  const handleUse = (shortcut: Shortcut) => {
    // Could navigate to agent launch with shortcut pre-filled
    router.push('/');
  };

  const handleEdit = (shortcut: Shortcut) => {
    setSelectedShortcut(shortcut);
    setView('edit');
  };

  const handleCreate = () => {
    setView('create');
  };

  const handleSave = () => {
    setView('list');
    setSelectedShortcut(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedShortcut(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Shortcuts
            </h1>
            {view === 'list' && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your prompt shortcuts for common tasks
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {view !== 'list' && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back to List
              </button>
            )}
            {view === 'list' && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Shortcut
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Content */}
        {view === 'list' && (
          <ShortcutLibrary
            onUse={handleUse}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {view === 'create' ? 'Create Shortcut' : 'Edit Shortcut'}
            </h2>
            <ShortcutForm
              shortcut={selectedShortcut || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

