'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AttendanceStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { getSession as getAuthSession } from '@/lib/auth';
import { logActivity } from './activity';

export async function markAttendance(studentId: string, sessionId: string, status: AttendanceStatus, targetDate?: Date) {
  try {
    const authSession = await getAuthSession();
    const date = targetDate ? dayjs(targetDate).startOf('day').toDate() : dayjs().startOf('day').toDate();

    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_sessionId_date: {
          studentId,
          sessionId,
          date,
        }
      }
    });

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_sessionId_date: {
          studentId,
          sessionId,
          date,
        }
      },
      update: {
        status,
        isArchived: false, // Restore if it was soft-deleted
      },
      create: {
        studentId,
        sessionId,
        date,
        status,
      }
    });

    const isEdit = !!existingAttendance && existingAttendance.status !== status;
    const actionLabel = existingAttendance 
      ? (existingAttendance.isArchived ? 'Attendance Restored' : 'Attendance Edited')
      : 'Attendance Recorded';

    if (!existingAttendance || isEdit || existingAttendance.isArchived) {
      if (authSession) {
        await prisma.attendanceAuditLog.create({
          data: {
            attendanceId: attendance.id,
            oldStatus: existingAttendance?.status,
            newStatus: status,
            editedById: authSession.id as string,
            reason: isEdit ? 'Status update' : 'Initial record',
          }
        });
      }

      const student = await prisma.student.findUnique({ where: { id: studentId } });
      await logActivity(
        actionLabel,
        `Student: ${student?.name || studentId}`,
        `Status changed to ${status} for date ${dayjs(date).format('YYYY-MM-DD')}`
      );
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/attendance');
    revalidatePath(`/dashboard/students/${studentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error marking attendance:', error);
    return { error: 'Failed to mark attendance' };
  }
}

export async function softDeleteAttendance(attendanceId: string) {
  try {
    const authSession = await getAuthSession();
    if (authSession?.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { isArchived: true },
      include: { student: true, session: true }
    });

    await prisma.attendanceAuditLog.create({
      data: {
        attendanceId: attendance.id,
        oldStatus: attendance.status,
        newStatus: 'ARCHIVED',
        editedById: authSession.id as string,
        reason: 'Soft deleted by admin',
      }
    });

    await logActivity(
      'Attendance Deleted',
      `Student: ${attendance.student.name}`,
      `Deleted attendance record for ${dayjs(attendance.date).format('YYYY-MM-DD')}`
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/attendance/history');
    revalidatePath(`/dashboard/students/${attendance.studentId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return { error: 'Failed to delete attendance' };
  }
}

export async function getTodaySessions(dayOfWeek: number) {
  const group0 = [0, 2, 4]; // Sun, Tue, Thu
  const group1 = [6, 1, 3]; // Sat, Mon, Wed
  
  let mappedGroup = -1;
  if (group0.includes(dayOfWeek)) mappedGroup = 0;
  if (group1.includes(dayOfWeek)) mappedGroup = 1;

  if (mappedGroup === -1) return [];

  return await prisma.session.findMany({
    where: { dayOfWeek: mappedGroup, isArchived: false },
    include: {
      _count: {
        select: { students: { where: { isArchived: false } } }
      }
    },
    orderBy: { time: 'asc' }
  });
}

export async function getAllSessions() {
  return await prisma.session.findMany({
    where: { isArchived: false },
    orderBy: [
      { dayOfWeek: 'asc' },
      { time: 'asc' }
    ]
  });
}

export async function getSessionAttendance(sessionId: string, targetDate?: Date) {
  const date = targetDate ? dayjs(targetDate).startOf('day').toDate() : dayjs().startOf('day').toDate();
  
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      students: {
        where: { isArchived: false },
        include: {
          attendances: {
            where: {
              sessionId,
              date: date,
              isArchived: false
            }
          },
          payments: {
            where: {
              month: date.getMonth() + 1,
              year: date.getFullYear()
            }
          }
        }
      }
    }
  });

  return session;
}

export async function getHistoricalSessions() {
  // We want to return a list of dates + session combos that have attendance records
  const attendances = await prisma.attendance.findMany({
    where: { isArchived: false },
    include: {
      session: true,
    },
    orderBy: { date: 'desc' },
  });

  // Group by date + sessionId
  const grouped = attendances.reduce((acc, curr) => {
    const key = `${curr.sessionId}_${curr.date.toISOString()}`;
    if (!acc[key]) {
      acc[key] = {
        sessionId: curr.sessionId,
        date: curr.date,
        sessionName: curr.session.grade,
        grade: curr.session.grade,
        time: curr.session.time,
        dayOfWeek: curr.session.dayOfWeek,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalStudents: 0,
      };
    }
    
    acc[key].totalStudents++;
    if (curr.status === 'PRESENT') acc[key].totalPresent++;
    if (curr.status === 'ABSENT') acc[key].totalAbsent++;
    if (curr.status === 'LATE') acc[key].totalLate++;
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getSessionHistoryDetails(sessionId: string, dateStr: string) {
  const date = new Date(dateStr);
  
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (!session) return null;

  const attendances = await prisma.attendance.findMany({
    where: {
      sessionId,
      date,
      isArchived: false
    },
    include: {
      student: true,
      auditLogs: {
        include: {
          editedBy: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  return { session, date, attendances };
}
