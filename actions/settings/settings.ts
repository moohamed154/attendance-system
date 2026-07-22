'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';

const DEFAULT_SETTINGS: Record<string, string> = {
  teacherName: '',
  centerName: '',
  reservation_enabled: 'true',
  waiting_list_enabled: 'true',
  max_pending_reservations: '2',
  reservation_expiration_hours: '48',
  allow_student_cancellation: 'true',
  allow_card_download: 'true',
  allow_reservation_qr: 'true',
  reservation_prefix: 'RES',
  reservation_notes: 'Please visit center within the configured reservation period to complete payment.',
  auto_notify_students: 'true',
  require_admin_confirmation: 'true',
};

const cachedGetSettings = unstable_cache(
  async () => {
    const settings = await prisma.setting.findMany();
    const map = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return { ...DEFAULT_SETTINGS, ...map };
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
