'use client';

import { useParams, useRouter } from 'next/navigation';
import { ConversationView } from '@/components/conversation';

/**
 * Agent Conversation Page
 * Displays the full conversation history for a specific agent
 */
export default function AgentConversationPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;

  const handleBack = () => {
    router.back();
  };

  if (!agentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">
          Agent ID not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl h-screen">
        <ConversationView
          agentId={agentId}
          onBack={handleBack}
          autoRefresh={true}
          refreshInterval={5000}
        />
      </div>
    </div>
  );
}
