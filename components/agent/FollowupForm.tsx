'use client';

import { useState } from 'react';
import { CursorAPIClient, FollowupRequest } from '@/lib/cursor-api';
import { getApiKey } from '@/lib/cursor-api/storage';

interface FollowupFormProps {
  agentId: string;
  onMessageSent?: () => void;
}

export default function FollowupForm({ agentId, onMessageSent }: FollowupFormProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError('API key not found. Please set your Cursor API key in settings.');
        setLoading(false);
        return;
      }

      const client = new CursorAPIClient(apiKey);
      const request: FollowupRequest = {
        message,
      };

      await client.sendFollowup(agentId, request);
      setSuccess('Message sent successfully!');
      
      if (onMessageSent) {
        onMessageSent();
      }

      // Reset form
      setMessage('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Message *
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Type your follow-up message..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

