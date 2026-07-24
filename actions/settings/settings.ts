'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import { getSession } from '@/lib/auth';

const DEFAULT_SETTINGS: Record<string, string> = {
  teacherName: '',
  centerName: 'My Center',
  centerNameAr: 'My Center',
  centerNameEn: 'My Center',
  centerLogo: '',
  centerAddress: '',
  centerPhone: '',
  centerEmail: '',
  centerWebsite: '',
  centerDescription: '',
  favicon: '',
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

export type CenterBranding = {
  teacherName: string;
  centerNameAr: string;
  centerNameEn: string;
  centerName: string;
  centerLogo: string;
  centerAddress: string;
  centerPhone: string;
  centerEmail: string;
  centerWebsite: string;
  centerDescription: string;
  favicon: string;
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

export const getCenterSettings = cache(async (): Promise<CenterBranding> => {
  const settings = await cachedGetSettings();
  const centerNameAr = settings.centerNameAr || settings.centerName || 'My Center';
  const centerNameEn = settings.centerNameEn || settings.centerName || 'My Center';
  const centerName = centerNameAr || centerNameEn || 'My Center';

  return {
    teacherName: settings.teacherName || '',
    centerNameAr,
    centerNameEn,
    centerName,
    centerLogo: settings.centerLogo || '',
    centerAddress: settings.centerAddress || '',
    centerPhone: settings.centerPhone || '',
    centerEmail: settings.centerEmail || '',
    centerWebsite: settings.centerWebsite || '',
    centerDescription: settings.centerDescription || '',
    favicon: settings.favicon || '',
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

export async function deleteAllStudents() {
  try {
    const adminSession = await getSession();
    if (adminSession?.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    await prisma.$transaction([
      prisma.waitingList.deleteMany(),
      prisma.reservationScanLog.deleteMany(),
      prisma.reservationStatusHistory.deleteMany(),
      prisma.reservation.deleteMany(),
      prisma.paymentTransaction.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.attendanceAuditLog.deleteMany(),
      prisma.attendance.deleteMany(),
      prisma.student.deleteMany(),
    ]);

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/attendance');
    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete all students' };
  }
}

export async function deleteAllSessions() {
  try {
    const adminSession = await getSession();
    if (adminSession?.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    await prisma.$transaction([
      prisma.waitingList.deleteMany(),
      prisma.reservationScanLog.deleteMany(),
      prisma.reservationStatusHistory.deleteMany(),
      prisma.reservation.deleteMany(),
      prisma.student.updateMany({ data: { sessionId: null } }),
      prisma.session.deleteMany(),
    ]);

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/sessions');
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/attendance');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete all sessions' };
  }
}
