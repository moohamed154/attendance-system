'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { AttendanceStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { getSession as getAuthSession } from '@/lib/auth';
import { logActivity } from './activity';
import { logger } from '@/lib/logger';

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
    revalidateTag('attendance-stats', 'max');
    revalidateTag('insights-stats', 'max');
    
    return { success: true };
  } catch (error) {
    logger.error('Error marking attendance', 'markAttendance', { error: String(error) });
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
    revalidateTag('attendance-stats', 'max');
    revalidateTag('insights-stats', 'max');

    return { success: true };
  } catch (error) {
    logger.error('Error deleting attendance', 'softDeleteAttendance', { error: String(error) });
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
export async function getHistoricalSessions(date?: string, grade?: string, sessionId?: string) {
  const where: any = { isArchived: false };
  
  if (date) {
    const targetDate = dayjs(date).startOf('day').toDate();
    const endDate = dayjs(date).add(1, 'day').startOf('day').toDate();
    where.date = {
      gte: targetDate,
      lt: endDate
    };
  }
  
  if (sessionId && sessionId !== 'all') {
    where.sessionId = sessionId;
  }
  
  if (grade && grade !== 'all') {
    where.session = { grade };
  }

  // Get unique sessionId + date combinations
  const groups = await prisma.attendance.groupBy({
    by: ['sessionId', 'date'],
    where,
    orderBy: [
      { date: 'desc' },
    ],
  });

  const sessionIds = Array.from(new Set(groups.map(g => g.sessionId)));
  const sessions = await prisma.session.findMany({
    where: { id: { in: sessionIds } }
  });
  const sessionsMap = new Map(sessions.map(s => [s.id, s]));

  // Get status counts grouped by sessionId and date
  const statusCounts = await prisma.attendance.groupBy({
    by: ['sessionId', 'date', 'status'],
    where,
    _count: {
      status: true
    }
  });

  const countsMap = new Map<string, { PRESENT: number; ABSENT: number; LATE: number; total: number }>();
  statusCounts.forEach(sc => {
    const key = `${sc.sessionId}_${sc.date.toISOString()}`;
    if (!countsMap.has(key)) {
      countsMap.set(key, { PRESENT: 0, ABSENT: 0, LATE: 0, total: 0 });
    }
    const counts = countsMap.get(key)!;
    const countVal = sc._count.status;
    counts[sc.status as 'PRESENT' | 'ABSENT' | 'LATE'] = countVal;
    counts.total += countVal;
  });

  const result = groups.map(g => {
    const session = sessionsMap.get(g.sessionId);
    const key = `${g.sessionId}_${g.date.toISOString()}`;
    const counts = countsMap.get(key) || { PRESENT: 0, ABSENT: 0, LATE: 0, total: 0 };
    
    return {
      sessionId: g.sessionId,
      date: g.date,
      sessionName: session?.grade || '',
      grade: session?.grade || '',
      time: session?.time || '',
      dayOfWeek: session?.dayOfWeek ?? 0,
      totalPresent: counts.PRESENT,
      totalAbsent: counts.ABSENT,
      totalLate: counts.LATE,
      totalStudents: counts.total,
    };
  }).filter(r => r.sessionName !== '');

  return result;
}

export async function getSessionHistoryDetails(sessionId: string, dateStr: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (!session) return null;

  const targetDate = new Date(dateStr);
  const startDate = dayjs(dateStr).subtract(1, 'day').toDate();
  const endDate = dayjs(dateStr).add(1, 'day').toDate();

  const attendances = await prisma.attendance.findMany({
    where: {
      sessionId,
      date: {
        gte: startDate,
        lte: endDate
      },
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

  const exactAttendances = attendances.filter(a => dayjs(a.date).format('YYYY-MM-DD') === dateStr);

  return { session, date: targetDate, attendances: exactAttendances };
}

export async function getAvailableDatesForSession(sessionId: string) {
  const groups = await prisma.attendance.groupBy({
    by: ['date'],
    where: { sessionId, isArchived: false },
    orderBy: { date: 'desc' }
  });

  return groups.map(a => dayjs(a.date).format('YYYY-MM-DD'));
}

export async function getAllHistoricalRecords(
  date?: string, 
  grade?: string, 
  sessionId?: string, 
  status?: string, 
  query?: string,
  skip: number = 0,
  take: number = 50
) {
  const where: any = { isArchived: false };
  
  if (date) {
    const targetDate = dayjs(date).startOf('day').toDate();
    const endDate = dayjs(date).add(1, 'day').startOf('day').toDate();
    where.date = {
      gte: targetDate,
      lt: endDate
    };
  }
  
  if (sessionId && sessionId !== 'all') {
    where.sessionId = sessionId;
  }
  
  if (grade && grade !== 'all') {
    where.session = { grade };
  }
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (query) {
    where.student = {
      ...where.student,
      OR: [
        { name: { contains: query } },
        { studentId: { contains: query } }
      ]
    };
  }

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: {
        session: true,
        student: true,
        auditLogs: {
          include: { editedBy: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take
    })
  ]);

  return { total, records };
}


export async function getPreviousSessionRecords(sessionId: string, targetDate?: Date) {
  const currentDate = targetDate ? dayjs(targetDate).startOf('day').toDate() : dayjs().startOf('day').toDate();
  
  const prevDateRecord = await prisma.attendance.findFirst({
    where: {
      sessionId,
      date: { lt: currentDate },
      isArchived: false,
    },
    orderBy: { date: 'desc' },
    select: { date: true }
  });

  if (!prevDateRecord) return null;

  const records = await prisma.attendance.findMany({
    where: {
      sessionId,
      date: prevDateRecord.date,
      isArchived: false,
    },
    select: {
      studentId: true,
      status: true,
    }
  });

  const recordsMap = records.reduce((acc, curr) => {
    acc[curr.studentId] = curr.status;
    return acc;
  }, {} as Record<string, AttendanceStatus>);

  return {
    date: prevDateRecord.date,
    records: recordsMap
  };
}
