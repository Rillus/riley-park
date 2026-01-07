/**
 * Tests for Shortcuts API Routes
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { prisma } from '@/lib/db';
import { seedPredefinedShortcuts } from '@/lib/shortcuts/seed';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    shortcut: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock seed function
jest.mock('@/lib/shortcuts/seed', () => ({
  seedPredefinedShortcuts: jest.fn(),
}));

describe('GET /api/shortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (seedPredefinedShortcuts as jest.Mock).mockResolvedValue(undefined);
  });

  it('should return all shortcuts', async () => {
    const mockShortcuts = [
      {
        id: '1',
        name: 'Test Shortcut',
        promptTemplate: 'Test template',
        category: 'Testing',
        isPredefined: false,
        userId: null,
        variables: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.shortcut.findMany as jest.Mock).mockResolvedValue(mockShortcuts);

    const request = new NextRequest('http://localhost/api/shortcuts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.shortcuts.length).toBe(1);
    expect(data.shortcuts[0].id).toBe(mockShortcuts[0].id);
    expect(data.shortcuts[0].name).toBe(mockShortcuts[0].name);
    expect(data.total).toBe(1);
    expect(seedPredefinedShortcuts).toHaveBeenCalled();
  });

  it('should filter by category', async () => {
    const mockShortcuts = [
      {
        id: '1',
        name: 'Test Shortcut',
        promptTemplate: 'Test template',
        category: 'Testing',
        isPredefined: false,
        userId: null,
        variables: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.shortcut.findMany as jest.Mock).mockResolvedValue(mockShortcuts);

    const request = new NextRequest('http://localhost/api/shortcuts?category=Testing');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.shortcut.findMany).toHaveBeenCalledWith({
      where: { category: 'Testing' },
      orderBy: [
        { isPredefined: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  });

  it('should filter by isPredefined', async () => {
    (prisma.shortcut.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/shortcuts?isPredefined=true');
    await GET(request);

    expect(prisma.shortcut.findMany).toHaveBeenCalledWith({
      where: { isPredefined: true },
      orderBy: [
        { isPredefined: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  });

  it('should search shortcuts by name', async () => {
    const mockShortcuts = [
      {
        id: '1',
        name: 'Test Shortcut',
        promptTemplate: 'Test template',
        category: 'Testing',
        isPredefined: false,
        userId: null,
        variables: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Other Shortcut',
        promptTemplate: 'Other template',
        category: 'Other',
        isPredefined: false,
        userId: null,
        variables: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.shortcut.findMany as jest.Mock).mockResolvedValue(mockShortcuts);

    const request = new NextRequest('http://localhost/api/shortcuts?search=Test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.shortcuts.length).toBe(1);
    expect(data.shortcuts[0].name).toBe('Test Shortcut');
  });

  it('should handle errors gracefully', async () => {
    (prisma.shortcut.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/shortcuts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch shortcuts');
  });
});

describe('POST /api/shortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new shortcut', async () => {
    const mockShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Create {feature}',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '["feature"]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.create as jest.Mock).mockResolvedValue(mockShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Shortcut',
        promptTemplate: 'Create {feature}',
        category: 'Testing',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.shortcut.id).toBe(mockShortcut.id);
    expect(data.shortcut.name).toBe(mockShortcut.name);
    expect(data.shortcut.promptTemplate).toBe(mockShortcut.promptTemplate);
    expect(data.shortcut.category).toBe(mockShortcut.category);
    expect(prisma.shortcut.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Shortcut',
        promptTemplate: 'Create {feature}',
        category: 'Testing',
        isPredefined: false,
        userId: null,
        variables: JSON.stringify(['feature']),
      },
    });
  });

  it('should create shortcut without category', async () => {
    const mockShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Create {feature}',
      category: null,
      isPredefined: false,
      userId: null,
      variables: '["feature"]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.create as jest.Mock).mockResolvedValue(mockShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Shortcut',
        promptTemplate: 'Create {feature}',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.shortcut.category).toBeNull();
  });

  it('should reject invalid input', async () => {
    const request = new NextRequest('http://localhost/api/shortcuts', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        promptTemplate: 'Test template',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should handle database errors', async () => {
    (prisma.shortcut.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/shortcuts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Shortcut',
        promptTemplate: 'Test template',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create shortcut');
  });
});

