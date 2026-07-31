process.env.TZ = 'Africa/Cairo';

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Final Production Startup Environment Verification
// Logs warnings at runtime to prevent cold-start crashes in Serverless/Vercel environments
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  if (missingEnv.length > 0) {
    logger.error(
      `🚨 [Production Configuration Alert] Missing environment variables: ${missingEnv.join(', ')}. Please configure these variables in your Vercel deployment dashboard.`,
      'StartupValidation'
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
