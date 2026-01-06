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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
