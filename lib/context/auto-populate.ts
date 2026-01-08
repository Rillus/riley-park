/**
 * Context Auto-population
 * 
 * Automatically populate feature context from workflow steps and other sources
 */

import { prisma } from '@/lib/db';
import { FeatureContextType } from './types';

/**
 * Auto-populate feature context from workflow step output
 */
export async function populateContextFromStep(
  featureId: string,
  stepType: string,
  output: string | null
): Promise<void> {
  if (!output || !output.trim()) {
    return;
  }

  // Map step types to context types
  const contextTypeMap: Record<string, FeatureContextType> = {
    spec: 'spec',
    design: 'design',
  };

  const contextType = contextTypeMap[stepType];
  if (!contextType) {
    return; // Only auto-populate spec and design steps
  }

  // Check if context already exists for this type
  const existing = await prisma.featureContext.findFirst({
    where: {
      featureId,
      contextType,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (existing) {
    // Update existing context
    await prisma.featureContext.update({
      where: { id: existing.id },
      data: {
        content: output,
      },
    });
  } else {
    // Create new context
    await prisma.featureContext.create({
      data: {
        featureId,
        content: output,
        contextType,
      },
    });
  }
}

/**
 * Auto-populate feature description context when feature is created
 */
export async function populateDescriptionContext(
  featureId: string,
  description: string
): Promise<void> {
  if (!description || !description.trim()) {
    return;
  }

  // Check if description context already exists
  const existing = await prisma.featureContext.findFirst({
    where: {
      featureId,
      contextType: 'description',
    },
  });

  if (!existing) {
    await prisma.featureContext.create({
      data: {
        featureId,
        content: description,
        contextType: 'description',
      },
    });
  }
}

/**
 * Store agent conversation in feature context as notes
 */
export async function storeConversationAsContext(
  featureId: string,
  conversation: Array<{ role: string; content: string }>
): Promise<void> {
  if (!conversation || conversation.length === 0) {
    return;
  }

  // Format conversation as markdown
  const content = conversation
    .map((msg) => {
      const roleLabel = msg.role === 'user' ? 'User' : 'Agent';
      return `### ${roleLabel}\n\n${msg.content}`;
    })
    .join('\n\n---\n\n');

  // Create a note with the conversation
  await prisma.featureContext.create({
    data: {
      featureId,
      content: `## Agent Conversation\n\n${content}`,
      contextType: 'notes',
    },
  });
}

