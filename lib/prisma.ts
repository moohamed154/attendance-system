import { PrismaClient } from '@prisma/client';

// Final Production Startup Environment Verification
// Only run at runtime (when NEXT_PHASE is undefined) to prevent Next.js build-time collection failures
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  if (missingEnv.length > 0) {
    throw new Error(
      `🚨 [Fatal Startup Error] Missing required environment variables: ${missingEnv.join(', ')}. Please set them in your deployment dashboard.`
    );
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
