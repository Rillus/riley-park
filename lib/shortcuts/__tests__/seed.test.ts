/**
 * Tests for shortcut seeding
 */

import { prisma } from '@/lib/db';
import { seedPredefinedShortcuts, arePredefinedShortcutsSeeded } from '../seed';
import { PREDEFINED_SHORTCUTS } from '../types';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    shortcut: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('seedPredefinedShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create shortcuts that do not exist', async () => {
    (prisma.shortcut.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.shortcut.create as jest.Mock).mockResolvedValue({});

    await seedPredefinedShortcuts();

    expect(prisma.shortcut.findFirst).toHaveBeenCalledTimes(PREDEFINED_SHORTCUTS.length);
    expect(prisma.shortcut.create).toHaveBeenCalledTimes(PREDEFINED_SHORTCUTS.length);
  });

  it('should not create shortcuts that already exist', async () => {
    (prisma.shortcut.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-id' });
    (prisma.shortcut.create as jest.Mock).mockResolvedValue({});

    await seedPredefinedShortcuts();

    expect(prisma.shortcut.findFirst).toHaveBeenCalledTimes(PREDEFINED_SHORTCUTS.length);
    expect(prisma.shortcut.create).not.toHaveBeenCalled();
  });

  it('should create shortcuts with correct data structure', async () => {
    (prisma.shortcut.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.shortcut.create as jest.Mock).mockResolvedValue({});

    await seedPredefinedShortcuts();

    const createCalls = (prisma.shortcut.create as jest.Mock).mock.calls;
    expect(createCalls.length).toBe(PREDEFINED_SHORTCUTS.length);

    // Check first shortcut (Create Spec)
    const firstCall = createCalls[0][0];
    expect(firstCall.data.name).toBe('Create Spec');
    expect(firstCall.data.isPredefined).toBe(true);
    expect(firstCall.data.userId).toBeNull();
    expect(firstCall.data.category).toBe('Specification');
    expect(firstCall.data.variables).toBeDefined();
    expect(JSON.parse(firstCall.data.variables)).toContain('feature');
  });

  it('should extract and store variables correctly', async () => {
    (prisma.shortcut.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.shortcut.create as jest.Mock).mockResolvedValue({});

    await seedPredefinedShortcuts();

    const createCalls = (prisma.shortcut.create as jest.Mock).mock.calls;
    
    // Check that variables are stored as JSON
    for (const call of createCalls) {
      const variables = JSON.parse(call[0].data.variables);
      expect(Array.isArray(variables)).toBe(true);
    }
  });
});

describe('arePredefinedShortcutsSeeded', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when all shortcuts are seeded', async () => {
    (prisma.shortcut.count as jest.Mock).mockResolvedValue(PREDEFINED_SHORTCUTS.length);

    const result = await arePredefinedShortcutsSeeded();
    expect(result).toBe(true);
    expect(prisma.shortcut.count).toHaveBeenCalledWith({
      where: {
        isPredefined: true,
      },
    });
  });

  it('should return false when not all shortcuts are seeded', async () => {
    (prisma.shortcut.count as jest.Mock).mockResolvedValue(PREDEFINED_SHORTCUTS.length - 1);

    const result = await arePredefinedShortcutsSeeded();
    expect(result).toBe(false);
  });

  it('should return true when more shortcuts exist than predefined', async () => {
    (prisma.shortcut.count as jest.Mock).mockResolvedValue(PREDEFINED_SHORTCUTS.length + 1);

    const result = await arePredefinedShortcutsSeeded();
    expect(result).toBe(true);
  });
});

