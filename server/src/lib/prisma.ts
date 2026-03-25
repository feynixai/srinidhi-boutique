import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // In test: pool size 1 to prevent deadlocks during cleanup
    ...(process.env.NODE_ENV === 'test' && {
      datasources: {
        db: {
          url: `${process.env.DATABASE_URL || 'postgresql://arun@localhost:5432/srinidhi_test'}?connection_limit=1`,
        },
      },
    }),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
