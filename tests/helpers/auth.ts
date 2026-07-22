import { prisma } from './db';
import bcrypt from 'bcrypt';

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 1000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw lastErr;
}

export async function ensureAdminExists() {
  const hashedPassword = await bcrypt.hash('admin_pass_123', 10);
  await withRetry(() =>
    prisma.user.upsert({
      where: { username: 'admin_e2e' },
      update: { password: hashedPassword, role: 'ADMIN' },
      create: {
        username: 'admin_e2e',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })
  );
}

export async function ensureAssistantExists() {
  const hashedPassword = await bcrypt.hash('assist_pass_123', 10);
  await withRetry(() =>
    prisma.user.upsert({
      where: { username: 'assistant_e2e' },
      update: { password: hashedPassword, role: 'ASSISTANT' },
      create: {
        username: 'assistant_e2e',
        password: hashedPassword,
        role: 'ASSISTANT',
      },
    })
  );
}
