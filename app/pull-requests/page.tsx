'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PullRequestList, PullRequestDetail } from '@/components/pull-requests';
import { PullRequestWithRelations } from '@/lib/pull-requests/types';

export default function PullRequestsPage() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedPR, setSelectedPR] = useState<PullRequestWithRelations | null>(null);

  const handleViewPR = (pr: PullRequestWithRelations) => {
    setSelectedPR(pr);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedPR(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Pull Requests
            </h1>
            {view === 'list' && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage pull requests created by agents
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {view !== 'list' && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back to List
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <PullRequestList onViewPR={handleViewPR} />
          </div>
        )}

        {view === 'detail' && selectedPR && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <PullRequestDetail
              prId={selectedPR.id}
              onBack={handleBack}
            />
          </div>
        )}
      </div>
    </div>
  );
}

