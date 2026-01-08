/**
 * Context Prompt Generator
 * 
 * Generates context prompts for agent launches
 */

import { prisma } from '@/lib/db';
import {
  ContextPromptOptions,
  ContextPromptResult,
  FeatureContextType,
} from './types';

/**
 * Simple token estimation (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 */
function truncateText(text: string, maxTokens: number): { text: string; truncated: boolean } {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }
  return {
    text: text.substring(0, maxChars - 100) + '\n\n[... content truncated due to token limit ...]',
    truncated: true,
  };
}

/**
 * Format project context for prompt
 */
function formatProjectContext(content: string): string {
  if (!content.trim()) {
    return '';
  }
  return `## Project Context\n\n${content}\n\n---\n\n`;
}

/**
 * Format feature context for prompt
 */
function formatFeatureContext(
  contexts: Array<{ content: string; contextType: string }>,
  includeTypes?: FeatureContextType[]
): string {
  if (contexts.length === 0) {
    return '';
  }

  const sections: string[] = [];
  const typeLabels: Record<string, string> = {
    description: 'Feature Description',
    spec: 'Specification',
    design: 'Design Document',
    notes: 'Additional Notes',
    feedback: 'Feedback',
  };

  // Group by type
  const grouped = contexts.reduce((acc, ctx) => {
    if (!includeTypes || includeTypes.includes(ctx.contextType as FeatureContextType)) {
      if (!acc[ctx.contextType]) {
        acc[ctx.contextType] = [];
      }
      acc[ctx.contextType].push(ctx);
    }
    return acc;
  }, {} as Record<string, Array<{ content: string; contextType: string }>>);

  // Add sections in order
  const order: FeatureContextType[] = ['description', 'spec', 'design', 'notes', 'feedback'];
  for (const type of order) {
    const entries = grouped[type];
    if (entries && entries.length > 0) {
      const label = typeLabels[type] || type;
      if (type === 'description' || type === 'spec' || type === 'design') {
        // Single entry for these types
        sections.push(`### ${label}\n\n${entries[entries.length - 1].content}\n\n`);
      } else {
        // Multiple entries for notes and feedback
        sections.push(`### ${label}\n\n`);
        for (const entry of entries) {
          sections.push(`${entry.content}\n\n---\n\n`);
        }
      }
    }
  }

  if (sections.length === 0) {
    return '';
  }

  return `## Feature Context\n\n${sections.join('')}---\n\n`;
}

/**
 * Generate context prompt for agent launch
 */
export async function generateContextPrompt(
  options: ContextPromptOptions
): Promise<ContextPromptResult> {
  const {
    projectId,
    featureId,
    includeProjectContext = true,
    includeFeatureContext = true,
    includeContextTypes,
    maxTokens = 8000, // Default token limit
  } = options;

  const parts: string[] = [];
  let totalTokens = 0;
  let truncated = false;
  let warning: string | undefined;

  // Fetch project context
  if (projectId && includeProjectContext) {
    const projectContext = await prisma.projectContext.findUnique({
      where: { projectId },
    });

    if (projectContext && projectContext.content.trim()) {
      const formatted = formatProjectContext(projectContext.content);
      const tokens = estimateTokens(formatted);
      
      if (totalTokens + tokens <= maxTokens) {
        parts.push(formatted);
        totalTokens += tokens;
      } else {
        const remaining = maxTokens - totalTokens;
        if (remaining > 100) {
          const truncatedResult = truncateText(formatted, Math.floor(remaining * 0.3));
          parts.push(truncatedResult.text);
          totalTokens += estimateTokens(truncatedResult.text);
          truncated = truncatedResult.truncated;
        } else {
          warning = 'Project context was excluded due to token limit';
        }
      }
    }
  }

  // Fetch feature context
  if (featureId && includeFeatureContext) {
    const featureContexts = await prisma.featureContext.findMany({
      where: { featureId },
      orderBy: [
        { contextType: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    if (featureContexts.length > 0) {
      const formatted = formatFeatureContext(featureContexts, includeContextTypes);
      if (formatted) {
        const tokens = estimateTokens(formatted);
        
        if (totalTokens + tokens <= maxTokens) {
          parts.push(formatted);
          totalTokens += tokens;
        } else {
          const remaining = maxTokens - totalTokens;
          if (remaining > 100) {
            const truncatedResult = truncateText(formatted, Math.floor(remaining * 0.7));
            parts.push(truncatedResult.text);
            totalTokens += estimateTokens(truncatedResult.text);
            truncated = truncated || truncatedResult.truncated;
          } else {
            warning = warning 
              ? `${warning}; Feature context was truncated due to token limit`
              : 'Feature context was truncated due to token limit';
          }
        }
      }
    }
  }

  const prompt = parts.join('');

  return {
    prompt,
    tokenEstimate: totalTokens,
    truncated,
    warning,
  };
}

