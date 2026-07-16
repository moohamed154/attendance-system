'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
  const settings = await prisma.setting.findMany();
  return settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateSettings(data: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update settings' };
  }
}
