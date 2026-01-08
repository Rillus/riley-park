'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CursorAPIClient, ConversationResponse, AgentStatus } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';
import ConversationMessage from './ConversationMessage';
import { fetchShortcuts, expandShortcut, Shortcut } from '@/lib/shortcuts/client';

interface ConversationViewProps {
  agentId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onBack?: () => void;
}

/**
 * ConversationView component displays the full conversation history
 * with auto-refresh when agent is running and follow-up input
 */
export default function ConversationView({
  agentId,
  autoRefresh = true,
  refreshInterval = 5000,
  onBack,
}: ConversationViewProps) {
  const [conversation, setConversation] = useState<ConversationResponse | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followupMessage, setFollowupMessage] = useState('');
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const [followupError, setFollowupError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchConversation = useCallback(async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError('API key not found. Please set your Cursor API key in settings.');
        setLoading(false);
        return;
      }

      const client = new CursorAPIClient(apiKey);
      const [conversationData, statusData] = await Promise.all([
        client.getConversation(agentId),
        client.getAgentStatus(agentId),
      ]);

      setConversation(conversationData);
      setAgentStatus(statusData.status);
      setError(null);

      // Scroll to bottom if new messages arrived
      if (conversationData.messages.length > previousMessageCount.current) {
        previousMessageCount.current = conversationData.messages.length;
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to load conversation: ${err.message}`
          : 'Failed to load conversation'
      );
    } finally {
      setLoading(false);
    }
  }, [agentId, scrollToBottom]);

  const handleSendFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupMessage.trim()) return;

    setSendingFollowup(true);
    setFollowupError(null);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setFollowupError('API key not found. Please set your Cursor API key in settings.');
        setSendingFollowup(false);
        return;
      }

      const client = new CursorAPIClient(apiKey);
      await client.sendFollowup(agentId, {
        message: followupMessage,
      });

      setFollowupMessage('');
      // Refresh conversation after sending
      await fetchConversation();
    } catch (err) {
      setFollowupError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again.'
      );
    } finally {
      setSendingFollowup(false);
    }
  };

  // Load shortcuts on mount
  useEffect(() => {
    setShortcutsLoading(true);
    fetchShortcuts()
      .then((data) => {
        // Show first 5 shortcuts as quick actions
        setShortcuts(data.shortcuts.slice(0, 5));
      })
      .catch((err) => {
        console.error('Failed to load shortcuts:', err);
      })
      .finally(() => {
        setShortcutsLoading(false);
      });
  }, []);

  // Handle shortcut selection
  const handleShortcutSelect = async (shortcut: Shortcut) => {
    try {
      // Extract context from conversation if available
      const expandedPrompt = await expandShortcut(shortcut.id, {
        feature: undefined,
        project: undefined,
        step: undefined,
        description: conversation?.messages[0]?.content || undefined,
      });
      
      // Insert expanded prompt into follow-up input
      setFollowupMessage(expandedPrompt);
    } catch (err) {
      console.error('Failed to expand shortcut:', err);
      setFollowupError('Failed to expand shortcut');
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Auto-refresh when agent is running
  useEffect(() => {
    if (!autoRefresh || agentStatus !== 'RUNNING') {
      return;
    }

    const interval = setInterval(fetchConversation, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, agentStatus, fetchConversation]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1 p-8">
          <div className="text-gray-600 dark:text-gray-400">
            Loading conversation...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        {onBack && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-center flex-1 p-8">
          <div className="text-red-600 dark:text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Conversation
          </h2>
        </div>
        {agentStatus && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              agentStatus === 'RUNNING'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : agentStatus === 'FINISHED'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : agentStatus === 'ERROR'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            {agentStatus}
          </span>
        )}
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversation?.messages.map((message) => (
              <ConversationMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && agentStatus === 'RUNNING' && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
            Auto-refreshing every {refreshInterval / 1000} seconds while agent is running...
          </p>
        </div>
      )}

      {/* Follow-up input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {/* Quick Shortcuts */}
        {shortcuts.length > 0 && (
          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Quick Shortcuts
            </label>
            <div className="flex flex-wrap gap-2">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={() => handleShortcutSelect(shortcut)}
                  disabled={sendingFollowup || shortcutsLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={shortcut.promptTemplate}
                >
                  {shortcut.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendFollowup} className="space-y-3">
          {followupError && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              {followupError}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={followupMessage}
              onChange={(e) => setFollowupMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sendingFollowup}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sendingFollowup || !followupMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {sendingFollowup ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
