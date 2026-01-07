/**
 * Seed predefined shortcuts into the database
 */

import { prisma } from '@/lib/db';
import { PREDEFINED_SHORTCUTS, extractVariables } from './types';

/**
 * Seed predefined shortcuts if they don't already exist
 */
export async function seedPredefinedShortcuts(): Promise<void> {
  for (const shortcut of PREDEFINED_SHORTCUTS) {
    // Check if shortcut already exists by name
    const existing = await prisma.shortcut.findFirst({
      where: {
        name: shortcut.name,
        isPredefined: true,
      },
    });

    if (!existing) {
      const variables = extractVariables(shortcut.promptTemplate);
      await prisma.shortcut.create({
        data: {
          name: shortcut.name,
          promptTemplate: shortcut.promptTemplate,
          category: shortcut.category,
          isPredefined: true,
          userId: null, // Predefined shortcuts are not user-specific
          variables: JSON.stringify(variables),
        },
      });
    }
  }
}

/**
 * Check if predefined shortcuts have been seeded
 */
export async function arePredefinedShortcutsSeeded(): Promise<boolean> {
  const count = await prisma.shortcut.count({
    where: {
      isPredefined: true,
    },
  });
  return count >= PREDEFINED_SHORTCUTS.length;
}

