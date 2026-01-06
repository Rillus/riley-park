/**
 * Output Extraction Logic
 * Parses agent conversation to extract step outputs
 */

import { ConversationMessage } from '@/lib/cursor-api/types';
import { WorkflowStepType, OutputExtractionResult } from './types';

/**
 * Extract output based on step type
 */
export function extractStepOutput(
  stepType: WorkflowStepType,
  messages: ConversationMessage[]
): OutputExtractionResult {
  switch (stepType) {
    case 'spec':
      return extractSpecificationOutput(messages);
    case 'design':
      return extractDesignOutput(messages);
    case 'implement':
      return extractImplementationOutput(messages);
    case 'review':
      return extractReviewOutput(messages);
    case 'test':
      return extractTestOutput(messages);
    case 'submit':
      return extractSubmitOutput(messages);
    default:
      return { success: false, output: null };
  }
}

/**
 * Extract specification document from conversation
 */
export function extractSpecificationOutput(
  messages: ConversationMessage[]
): OutputExtractionResult {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');
  
  // Look for specification document patterns
  const specPatterns = [
    /^#\s*(Specification|Feature Specification|Feature|Requirements)/im,
    /^##\s*(Specification|Feature Specification|Feature|Requirements)/im,
  ];

  for (const message of assistantMessages.reverse()) {
    for (const pattern of specPatterns) {
      if (pattern.test(message.content)) {
        const documentTitle = extractDocumentTitle(message.content);
        return {
          success: true,
          output: message.content,
          metadata: {
            documentTitle: documentTitle || 'Specification Document',
          },
        };
      }
    }

    // Also check for overview/requirements sections
    if (
      message.content.includes('## Overview') ||
      message.content.includes('## Requirements') ||
      message.content.includes('## Acceptance Criteria')
    ) {
      const documentTitle = extractDocumentTitle(message.content);
      return {
        success: true,
        output: message.content,
        metadata: {
          documentTitle: documentTitle || 'Specification Document',
        },
      };
    }
  }

  return { success: false, output: null };
}

/**
 * Extract design document from conversation
 */
export function extractDesignOutput(
  messages: ConversationMessage[]
): OutputExtractionResult {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  // Look for design document patterns
  const designPatterns = [
    /^#\s*(Design|Technical Design|Design Document|Architecture)/im,
    /^##\s*(Design|Technical Design|Design Document|Architecture)/im,
  ];

  for (const message of assistantMessages.reverse()) {
    for (const pattern of designPatterns) {
      if (pattern.test(message.content)) {
        const documentTitle = extractDocumentTitle(message.content);
        return {
          success: true,
          output: message.content,
          metadata: {
            documentTitle: documentTitle || 'Design Document',
          },
        };
      }
    }

    // Also check for architecture/components sections
    if (
      message.content.includes('## Architecture') ||
      message.content.includes('## Components') ||
      message.content.includes('## API Endpoints') ||
      message.content.includes('### API Endpoints') ||
      message.content.includes('## Data Flow') ||
      message.content.includes('## Database Schema')
    ) {
      const documentTitle = extractDocumentTitle(message.content);
      return {
        success: true,
        output: message.content,
        metadata: {
          documentTitle: documentTitle || 'Design Document',
        },
      };
    }
  }

  return { success: false, output: null };
}

/**
 * Extract implementation output from conversation (looks for PR creation)
 */
export function extractImplementationOutput(
  messages: ConversationMessage[]
): OutputExtractionResult {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  // Combine all assistant messages to find PR URL
  const allContent = assistantMessages.map((m) => m.content).join('\n');
  const prUrl = findPRUrl(allContent);

  // Look for implementation completion indicators
  const implementationPatterns = [
    /implement(ed|ation)/i,
    /complete(d)?/i,
    /creat(ed|ing)/i,
    /push(ed)?/i,
    /commit(ted)?/i,
  ];

  for (const message of assistantMessages.reverse()) {
    for (const pattern of implementationPatterns) {
      if (pattern.test(message.content)) {
        const summary = extractImplementationSummary(message.content);
        return {
          success: true,
          output: summary || 'Implementation completed.',
          metadata: prUrl ? { prUrl } : undefined,
        };
      }
    }
  }

  // If we found a PR URL, consider it successful even without explicit completion message
  if (prUrl) {
    return {
      success: true,
      output: 'Implementation completed with PR created.',
      metadata: { prUrl },
    };
  }

  return { success: false, output: null };
}

/**
 * Extract review output from conversation
 */
export function extractReviewOutput(
  messages: ConversationMessage[]
): OutputExtractionResult {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  // Look for review patterns
  const reviewPatterns = [
    /^#\s*(Code Review|Review|Review Complete)/im,
    /^##\s*(Code Review|Review|Review Complete)/im,
    /review/i,
    /approved/i,
    /changes\s+requested/i,
  ];

  for (const message of assistantMessages.reverse()) {
    for (const pattern of reviewPatterns) {
      if (pattern.test(message.content)) {
        const reviewComments = extractReviewComments(message.content);
        return {
          success: true,
          output: message.content,
          metadata: reviewComments.length > 0 ? { reviewComments } : undefined,
        };
      }
    }
  }

  return { success: false, output: null };
}

/**
 * Extract test output from conversation
 */
export function extractTestOutput(
  messages: ConversationMessage[]
): OutputExtractionResult {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  // Look for test result patterns
  const testPatterns = [
    /^#\s*(Test Results|Tests|Testing)/im,
    /^##\s*(Test Results|Tests|Testing)/im,
    /tests?\s+(passed|completed|finished)/i,
    /all\s+tests\s+pass/i,
    /test\s+suite/i,
    /coverage/i,
  ];

  for (const message of assistantMessages.reverse()) {
    for (const pattern of testPatterns) {
      if (pattern.test(message.content)) {
        return {
          success: true,
          output: message.content,
        };
      }
    }
  }

  return { success: false, output: null };
}

/**
 * Extract submit/PR finalisation output from conversation
 */
export function extractSubmitOutput(
  messages: ConversationMessage[]
): OutputExtractionResult {
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  // Look for PR finalisation patterns
  const submitPatterns = [
    /pr\s+(has\s+been\s+)?(finali[sz]ed|merged|ready)/i,
    /pull\s+request\s+(has\s+been\s+)?(finali[sz]ed|merged|ready)/i,
    /merge(d)?\s+(into|to)\s+main/i,
    /ready\s+(for|to)\s+merge/i,
  ];

  // Combine all assistant messages to find PR URL
  const allContent = assistantMessages.map((m) => m.content).join('\n');
  const prUrl = findPRUrl(allContent);

  for (const message of assistantMessages.reverse()) {
    for (const pattern of submitPatterns) {
      if (pattern.test(message.content)) {
        return {
          success: true,
          output: message.content,
          metadata: prUrl ? { prUrl } : undefined,
        };
      }
    }
  }

  return { success: false, output: null };
}

/**
 * Find GitHub PR URL in content
 */
export function findPRUrl(content: string): string | null {
  const prUrlPattern = /https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+/;
  const match = content.match(prUrlPattern);
  return match ? match[0] : null;
}

/**
 * Find a document section starting with specific headers
 */
export function findDocumentSection(
  content: string,
  headerPatterns: string[]
): string | null {
  for (const pattern of headerPatterns) {
    const index = content.indexOf(pattern);
    if (index !== -1) {
      return content.substring(index);
    }
  }
  return null;
}

/**
 * Extract document title from markdown content
 */
function extractDocumentTitle(content: string): string | null {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extract implementation summary from message content
 */
function extractImplementationSummary(content: string): string | null {
  // Look for summary sections or list of completed items
  const lines = content.split('\n');
  const summaryLines: string[] = [];
  let inSummary = false;

  for (const line of lines) {
    if (
      line.includes('implementation') ||
      line.includes('completed') ||
      line.includes('created') ||
      line.startsWith('- ') ||
      line.startsWith('1. ') ||
      line.startsWith('* ')
    ) {
      inSummary = true;
    }

    if (inSummary && line.trim()) {
      summaryLines.push(line);
    }
  }

  return summaryLines.length > 0 ? summaryLines.join('\n') : null;
}

/**
 * Extract review comments/issues from review content
 */
function extractReviewComments(content: string): string[] {
  const comments: string[] = [];
  const lines = content.split('\n');
  let inIssues = false;

  for (const line of lines) {
    // Look for issues/comments sections
    if (
      line.includes('Issues Found') ||
      line.includes('Problems') ||
      line.includes('Concerns')
    ) {
      inIssues = true;
      continue;
    }

    // Stop at next major section
    if (inIssues && line.match(/^#+\s+/)) {
      inIssues = false;
    }

    // Extract numbered or bulleted items in issues section
    if (inIssues) {
      const itemMatch = line.match(/^\s*(\d+\.|-|\*)\s+(.+)/);
      if (itemMatch) {
        comments.push(itemMatch[2].trim());
      }
    }
  }

  return comments;
}
