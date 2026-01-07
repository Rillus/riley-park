'use client';

import { useState, useEffect } from 'react';
import type { FeatureMetadata } from '@/lib/features/parser';
import { marked } from 'marked';

interface FeatureSpecViewerProps {
  feature: FeatureMetadata;
  onLoadIntoChat?: (spec: string, feature?: FeatureMetadata) => void;
  onClose?: () => void;
}

export default function FeatureSpecViewer({
  feature,
  onLoadIntoChat,
  onClose,
}: FeatureSpecViewerProps) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    // Render markdown to HTML
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    const html = marked.parse(feature.content);
    setHtmlContent(html as string);
  }, [feature.content]);

  const handleLoadIntoChat = () => {
    if (onLoadIntoChat) {
      // Format the spec for the agent prompt
      const formattedSpec = `Please implement the following feature specification:

${feature.content}

Please follow the requirements, acceptance criteria, and technical requirements outlined in the specification.`;
      onLoadIntoChat(formattedSpec, feature);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {feature.title}
            </h2>
            <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              {feature.priority && (
                <span>
                  <strong>Priority:</strong> {feature.priority}
                </span>
              )}
              {feature.status && (
                <span>
                  <strong>Status:</strong> {feature.status}
                </span>
              )}
              {feature.estimatedTime && (
                <span>
                  <strong>Time:</strong> {feature.estimatedTime}
                </span>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          {onLoadIntoChat && (
            <button
              onClick={handleLoadIntoChat}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Load into Chat
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

