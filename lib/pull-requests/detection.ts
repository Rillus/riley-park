/**
 * PR Detection Service
 * Detects PRs in agent conversations and extracts PR information
 */

import { ConversationMessage } from '@/lib/cursor-api/types';
import { parseGitHubPRUrl, extractBranchName } from './types';

/**
 * PR information extracted from a message
 */
export interface ExtractedPRInfo {
  prUrl: string;
  prNumber: number;
  prTitle: string | null;
  branchName: string | null;
}

/**
 * Extract PR information from a single message
 */
export function extractPRInfoFromMessage(
  message: ConversationMessage
): ExtractedPRInfo | null {
  // Only check assistant messages (agents create PRs, not users)
  if (message.role !== 'assistant') {
    return null;
  }

  const content = message.content;
  
  // Find GitHub PR URL
  const prUrlPattern = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;
  const prUrlMatch = content.match(prUrlPattern);
  
  if (!prUrlMatch || prUrlMatch.length === 0) {
    return null;
  }

  // Use the first PR URL found
  const prUrl = prUrlMatch[0];
  
  // Parse PR URL to get owner, repo, and PR number
  const parsed = parseGitHubPRUrl(prUrl);
  if (!parsed) {
    return null;
  }

  // Try to extract PR title from message
  let prTitle: string | null = null;
  const titlePatterns = [
    /(?:title|pr\s+title|pull\s+request\s+title)[:\s]+(.+?)(?:\n|$)/i,
    /(?:created|opened)\s+(?:pr|pull\s+request)[:\s]+(.+?)(?:\n|$)/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      prTitle = match[1].trim();
      break;
    }
  }

  // Try to extract branch name
  const branchName = extractBranchName(prUrl, prTitle || content);

  return {
    prUrl,
    prNumber: parsed.prNumber,
    prTitle,
    branchName,
  };
}

/**
 * Detect all PRs in a conversation
 * Returns array of extracted PR info (may contain duplicates)
 */
export function detectPRsInConversation(
  messages: ConversationMessage[]
): ExtractedPRInfo[] {
  const prs: ExtractedPRInfo[] = [];
  const seenUrls = new Set<string>();

  for (const message of messages) {
    const prInfo = extractPRInfoFromMessage(message);
    
    if (prInfo && !seenUrls.has(prInfo.prUrl)) {
      prs.push(prInfo);
      seenUrls.add(prInfo.prUrl);
    }
  }

  return prs;
}

