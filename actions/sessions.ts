'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';

export async function getSessions(query?: string, grade?: string, dayOfWeek?: string) {
  const where: any = {};
  
  if (query) {
    where.time = { contains: query };
  }
  
  if (grade && grade !== 'all') {
    where.grade = grade;
  }
  
  if (dayOfWeek && dayOfWeek !== 'all') {
    where.dayOfWeek = parseInt(dayOfWeek);
  }

  where.isArchived = false;

  return await prisma.session.findMany({
    where,
    include: {
      _count: {
        select: { students: true }
      }
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { time: 'asc' }
    ]
  });
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
    revalidatePath('/dashboard/sessions');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
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
    revalidatePath('/dashboard/sessions');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update session' };
  }
}

export async function deleteSession(id: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
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
      revalidatePath('/dashboard/sessions');
      revalidatePath('/dashboard');
      return { success: true, archived: true };
    }

    await prisma.session.delete({
      where: { id },
    });
    await logActivity('Session Deleted', `Session: ${session.grade} - ${session.time}`);
    revalidatePath('/dashboard/sessions');
    revalidatePath('/dashboard');
    return { success: true, archived: false };
  } catch (error) {
    return { error: 'Failed to delete session' };
  }
}
