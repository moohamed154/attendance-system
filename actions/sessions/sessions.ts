'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { logActivity } from '../settings/activity';
import { Prisma } from '@prisma/client';

// ─── Cached read: sessions list (no user-specific params, suitable for caching) ───
const cachedGetSessions = unstable_cache(
  async (query?: string, grade?: string, dayOfWeek?: string) => {
    const where: Prisma.SessionWhereInput = { isArchived: false };

    if (query) {
      where.time = { contains: query };
    }

    if (grade && grade !== 'all') {
      where.grade = grade;
    }

    if (dayOfWeek && dayOfWeek !== 'all') {
      where.dayOfWeek = parseInt(dayOfWeek);
    }

    return await prisma.session.findMany({
      where,
      include: {
        _count: {
          select: { students: { where: { isArchived: false } } }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { time: 'asc' }
      ]
    });
  },
  ['sessions-list'],
  { tags: ['sessions'], revalidate: 300 } // 5-minute cache
);

export async function getSessions(query?: string, grade?: string, dayOfWeek?: string) {
  return cachedGetSessions(query, grade, dayOfWeek);
}

export async function createSession(data: {
  dayOfWeek: number;
  time: string;
  grade: string;
}) {
  try {
    await prisma.session.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        time: data.time,
        grade: data.grade,
      }
    });
    await logActivity('Session Created', `Session: ${data.grade} - ${data.time}`);
    revalidateTag('sessions', 'max');
    revalidatePath('/dashboard/sessions');
    return { success: true };
  } catch {
    return { error: 'Failed to create session' };
  }
}

export async function updateSession(id: string, data: {
  dayOfWeek: number;
  time: string;
  grade: string;
}) {
  try {
    await prisma.session.update({
      where: { id },
      data: {
        dayOfWeek: data.dayOfWeek,
        time: data.time,
        grade: data.grade,
      }
    });
    await logActivity('Session Updated', `Session: ${data.grade} - ${data.time}`);
    revalidateTag('sessions', 'max');
    revalidatePath('/dashboard/sessions');
    return { success: true };
  } catch {
    return { error: 'Failed to update session' };
  }
}

export async function deleteSession(id: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id },
      select: {
        id: true,
        grade: true,
        time: true,
        _count: {
          select: { attendances: true, students: true }
        }
      }
    });

    if (!session) return { error: 'Session not found' };

    if (session._count.attendances > 0 || session._count.students > 0) {
      await prisma.session.update({
        where: { id },
        data: { isArchived: true }
      });
      await logActivity('Session Archived', `Session: ${session.grade} - ${session.time}`);
      revalidateTag('sessions', 'max');
      revalidatePath('/dashboard/sessions');
      return { success: true, archived: true };
    }

    await prisma.session.delete({
      where: { id },
    });
    await logActivity('Session Deleted', `Session: ${session.grade} - ${session.time}`);
    revalidateTag('sessions', 'max');
    revalidatePath('/dashboard/sessions');
    return { success: true, archived: false };
  } catch {
    return { error: 'Failed to delete session' };
  }
}
