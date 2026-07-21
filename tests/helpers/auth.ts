import { prisma } from './db';
import bcrypt from 'bcrypt';

export async function ensureAdminExists() {
  const hashedPassword = await bcrypt.hash('admin_pass_123', 10);
  await prisma.user.upsert({
    where: { username: 'admin_e2e' },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      username: 'admin_e2e',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });
}

export async function ensureAssistantExists() {
  const hashedPassword = await bcrypt.hash('assist_pass_123', 10);
  await prisma.user.upsert({
    where: { username: 'assistant_e2e' },
    update: { password: hashedPassword, role: 'ASSISTANT' },
    create: {
      username: 'assistant_e2e',
      password: hashedPassword,
      role: 'ASSISTANT',
    }
  });
}
