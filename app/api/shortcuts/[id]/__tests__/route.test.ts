/**
 * Tests for Individual Shortcut API Routes
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    shortcut: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('GET /api/shortcuts/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return shortcut by id', async () => {
    const mockShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(mockShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1');
    const response = await GET(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.shortcut.id).toBe(mockShortcut.id);
    expect(data.shortcut.name).toBe(mockShortcut.name);
    expect(data.shortcut.promptTemplate).toBe(mockShortcut.promptTemplate);
    expect(prisma.shortcut.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should return 404 if shortcut not found', async () => {
    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/shortcuts/999');
    const response = await GET(request, {
      params: Promise.resolve({ id: '999' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Shortcut not found');
  });

  it('should handle errors gracefully', async () => {
    (prisma.shortcut.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/shortcuts/1');
    const response = await GET(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch shortcut');
  });
});

describe('PUT /api/shortcuts/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update shortcut', async () => {
    const existingShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedShortcut = {
      ...existingShortcut,
      name: 'Updated Shortcut',
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(existingShortcut);
    (prisma.shortcut.update as jest.Mock).mockResolvedValue(updatedShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Shortcut',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.shortcut.name).toBe('Updated Shortcut');
  });

  it('should update prompt template and re-extract variables', async () => {
    const existingShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedShortcut = {
      ...existingShortcut,
      promptTemplate: 'Create {feature} in {project}',
      variables: '["feature","project"]',
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(existingShortcut);
    (prisma.shortcut.update as jest.Mock).mockResolvedValue(updatedShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1', {
      method: 'PUT',
      body: JSON.stringify({
        promptTemplate: 'Create {feature} in {project}',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.shortcut.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        promptTemplate: 'Create {feature} in {project}',
        variables: JSON.stringify(['feature', 'project']),
      },
    });
  });

  it('should return 404 if shortcut not found', async () => {
    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/shortcuts/999', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Shortcut',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: '999' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Shortcut not found');
  });

  it('should prevent editing predefined shortcuts', async () => {
    const predefinedShortcut = {
      id: '1',
      name: 'Predefined Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: true,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(predefinedShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Shortcut',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Cannot edit predefined shortcuts');
    expect(prisma.shortcut.update).not.toHaveBeenCalled();
  });

  it('should reject invalid input', async () => {
    const existingShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(existingShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1', {
      method: 'PUT',
      body: JSON.stringify({
        name: '',
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });
});

describe('DELETE /api/shortcuts/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete shortcut', async () => {
    const existingShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(existingShortcut);
    (prisma.shortcut.delete as jest.Mock).mockResolvedValue(existingShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.shortcut.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should return 404 if shortcut not found', async () => {
    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/shortcuts/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '999' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Shortcut not found');
  });

  it('should prevent deleting predefined shortcuts', async () => {
    const predefinedShortcut = {
      id: '1',
      name: 'Predefined Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: true,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(predefinedShortcut);

    const request = new NextRequest('http://localhost/api/shortcuts/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Cannot delete predefined shortcuts');
    expect(prisma.shortcut.delete).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const existingShortcut = {
      id: '1',
      name: 'Test Shortcut',
      promptTemplate: 'Test template',
      category: 'Testing',
      isPredefined: false,
      userId: null,
      variables: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.shortcut.findUnique as jest.Mock).mockResolvedValue(existingShortcut);
    (prisma.shortcut.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/shortcuts/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete shortcut');
  });
});

