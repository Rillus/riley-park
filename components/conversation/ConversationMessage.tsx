'use client';

import { useMemo } from 'react';
import { marked } from 'marked';
import { ConversationMessage as ConversationMessageType } from '@/lib/cursor-api/types';

interface ConversationMessageProps {
  message: ConversationMessageType;
}

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Format timestamp to a readable time string
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

/**
 * ConversationMessage component displays a single message in the conversation
 * with different styling for user vs assistant messages
 */
export default function ConversationMessage({ message }: ConversationMessageProps) {
  const { id, role, content, timestamp, images } = message;
  const isUser = role === 'user';

  // Parse markdown content
  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      data-testid={`message-${id}`}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        }`}
      >
        {/* Role label */}
        <div className={`text-xs font-semibold mb-2 ${
          isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {isUser ? 'You' : 'Agent'}
        </div>

        {/* Images if present */}
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Attachment ${index + 1}`}
                className="max-w-[200px] max-h-[200px] rounded border border-gray-200 dark:border-gray-600"
              />
            ))}
          </div>
        )}

        {/* Message content with markdown */}
        <div
          className={`prose prose-sm max-w-none ${
            isUser
              ? 'prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-code:text-blue-200 prose-code:bg-blue-700'
              : 'dark:prose-invert'
          }`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Timestamp */}
        <div className={`text-xs mt-2 ${
          isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
}
