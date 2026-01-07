/**
 * Tests for Shortcut Expand API Route
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    shortcut: {
      findUnique: jest.fn(),
    },
  },
}));

describe('POST /api/shortcuts/:id/expand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expand shortcut with variables', async () => {
    const mockShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Create {feature} in {project}',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '["feature","project"]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(mockShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1/expand', {
      method: 'POST',
      body: JSON.stringify({
        feature: 'Test Feature',
        project: 'Test Project',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expandedPrompt).toBe('Create Test Feature in Test Project');
  });

  it('should expand shortcut with all variables', async () => {
    const mockShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Create {feature} in {project} for {step} with {description}',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '["feature","project","step","description"]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(mockShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1/expand', {
      method: 'POST',
      body: JSON.stringify({
        feature: 'Test Feature',
        project: 'Test Project',
        step: 'spec',
        description: 'Test description',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expandedPrompt).toBe('Create Test Feature in Test Project for spec with Test description');
  });

  it('should handle missing variables gracefully', async () => {
    const mockShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Create {feature} in {project}',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '["feature","project"]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(mockShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1/expand', {
      method: 'POST',
      body: JSON.stringify({
        feature: 'Test Feature',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expandedPrompt).toBe('Create Test Feature in ');
  });

  it('should return 404 if shortcut not found', async () => {
    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/shortcuts/999/expand', {
      method: 'POST',
      body: JSON.stringify({
        feature: 'Test Feature',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: '999' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Shortcut not found');
  });

  it('should handle errors gracefully', async () => {
    (prisma.shortcut.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/shortcuts/1/expand', {
      method: 'POST',
      body: JSON.stringify({
        feature: 'Test Feature',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to expand shortcut');
  });
});

