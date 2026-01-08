/**
 * Prisma Database Client
 * 
 * Singleton instance to avoid multiple connections in development
 * Uses libSQL adapter for SQLite support in Prisma 7
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Get the database URL from environment variable
  const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  
  // Create Prisma adapter with URL config
  const adapter = new PrismaLibSql({ url: databaseUrl });
  
  // Create and return PrismaClient with adapter
  return new PrismaClient({ adapter });
}

// In development, check if the client has all expected models
// If not, clear the cache and recreate (handles Prisma client regeneration)
function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  
  // Check if client exists and has the projectContext model as a proper delegate
  if (existing && existing.projectContext && typeof existing.projectContext.findUnique === 'function') {
    return existing;
  }
  
  // If client exists but is missing models, clear cache and recreate
  if (existing) {
    console.warn('Prisma client missing models, recreating...');
    if (existing.$disconnect) {
      existing.$disconnect().catch(() => {});
    }
    globalForPrisma.prisma = undefined;
  }
  
  const client = createPrismaClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  
  return client;
}

export const prisma = getPrismaClient();
