'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

const cachedGetSettings = unstable_cache(
  async () => {
    const settings = await prisma.setting.findMany();
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  },
  ['settings'],
  { tags: ['settings'] }
);

export const getSettings = cache(async () => {
  return cachedGetSettings();
});

export const getCenterSettings = cache(async () => {
  const settings = await cachedGetSettings();
  return {
    teacherName: settings.teacherName || '',
    centerName: settings.centerName || '',
  };
});

export async function updateSettings(data: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
    revalidateTag('settings', 'max');
    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch {
    return { error: 'Failed to update settings' };
  }
}
