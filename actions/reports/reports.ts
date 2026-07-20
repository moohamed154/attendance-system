'use server';

import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';
import { unstable_cache } from 'next/cache';

const cachedGetAttendanceStats = unstable_cache(
  async (startStr: string, endStr: string) => {
    const start = startStr === 'default_start' ? dayjs().subtract(30, 'days').toDate() : new Date(startStr);
    const end = endStr === 'default_end' ? dayjs().toDate() : new Date(endStr);
    
    const rawData = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: {
        date: { gte: start, lte: end },
        isArchived: false,
      },
      _count: {
        id: true
      }
    });

    const chartMap = new Map();
    rawData.forEach(item => {
      const dateStr = dayjs(item.date).format('MMM D');
      if (!chartMap.has(dateStr)) {
        chartMap.set(dateStr, { date: dateStr, PRESENT: 0, ABSENT: 0, LATE: 0 });
      }
      const entry = chartMap.get(dateStr);
      entry[item.status] = item._count.id;
    });

    return Array.from(chartMap.values()).sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  },
  ['attendance-stats'],
  { tags: ['attendance-stats'], revalidate: 3600 }
);

export async function getAttendanceStats(startDate?: Date, endDate?: Date) {
  const startStr = startDate ? startDate.toISOString() : 'default_start';
  const endStr = endDate ? endDate.toISOString() : 'default_end';
  return cachedGetAttendanceStats(startStr, endStr);
}

const cachedGetPaymentStats = unstable_cache(
  async (startStr: string, endStr: string) => {
    const start = startStr === 'default_start' ? dayjs().startOf('year').toDate() : new Date(startStr);
    const end = endStr === 'default_end' ? dayjs().endOf('year').toDate() : new Date(endStr);
    
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        date: { gte: start, lte: end }
      },
      select: {
        amount: true,
        date: true,
      }
    });

    const isWideRange = dayjs(end).diff(dayjs(start), 'month') > 2;

    const chartMap = new Map();
    
    transactions.forEach(tx => {
      const dateKey = isWideRange ? dayjs(tx.date).format('MMM YYYY') : dayjs(tx.date).format('MMM D');
      if (!chartMap.has(dateKey)) {
        chartMap.set(dateKey, { date: dateKey, Revenue: 0, SortKey: dayjs(tx.date).valueOf() });
      }
      const entry = chartMap.get(dateKey);
      entry.Revenue += tx.amount;
    });

    return Array.from(chartMap.values()).sort((a, b) => a.SortKey - b.SortKey);
  },
  ['payment-stats'],
  { tags: ['payment-stats'], revalidate: 3600 }
);

export async function getPaymentStats(startDate?: Date, endDate?: Date) {
  const startStr = startDate ? startDate.toISOString() : 'default_start';
  const endStr = endDate ? endDate.toISOString() : 'default_end';
  return cachedGetPaymentStats(startStr, endStr);
}

const cachedGetTopInsights = unstable_cache(
  async (startStr: string, endStr: string) => {
    const start = startStr === 'default_start' ? dayjs().subtract(30, 'days').toDate() : new Date(startStr);
    const end = endStr === 'default_end' ? dayjs().toDate() : new Date(endStr);
    
    // Most absent students
    const absentRecords = await prisma.attendance.groupBy({
      by: ['studentId'],
      where: { status: 'ABSENT', date: { gte: start, lte: end }, isArchived: false },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const absentStudentIds = absentRecords.map(r => r.studentId);
    const absentStudents = await prisma.student.findMany({
      where: { id: { in: absentStudentIds } },
      select: { id: true, name: true }
    });
    const absentStudentMap = new Map(absentStudents.map(s => [s.id, s]));
    const mostAbsent = absentRecords.map((rec) => {
      const student = absentStudentMap.get(rec.studentId);
      return { id: student?.id, name: student?.name || 'Unknown', absences: rec._count.id };
    });

    // Best attendance
    const presentRecords = await prisma.attendance.groupBy({
      by: ['studentId'],
      where: { status: 'PRESENT', date: { gte: start, lte: end }, isArchived: false },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const presentStudentIds = presentRecords.map(r => r.studentId);
    const presentStudents = await prisma.student.findMany({
      where: { id: { in: presentStudentIds } },
      select: { id: true, name: true }
    });
    const presentStudentMap = new Map(presentStudents.map(s => [s.id, s]));
    const bestAttendance = presentRecords.map((rec) => {
      const student = presentStudentMap.get(rec.studentId);
      return { id: student?.id, name: student?.name || 'Unknown', present: rec._count.id };
    });

    // Total pending payments (all time up to end date, or just specific month if we look at expected vs collected)
    // Let's get total amount due vs paid for active students
    const payments = await prisma.payment.aggregate({
      where: { 
        createdAt: { lte: end },
      },
      _sum: { amount: true, amountPaid: true },
    });

    const expected = payments._sum.amount || 0;
    const collected = payments._sum.amountPaid || 0;
    const pending = expected - collected;

    // Payments created in this range specifically that are unpaid/partial
    const recentPending = await prisma.payment.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      _sum: { amount: true, amountPaid: true },
      _count: { id: true }
    });

    return {
      mostAbsent,
      bestAttendance,
      financials: {
        totalExpected: expected,
        totalCollected: collected,
        totalPending: pending,
        recentPendingAmount: (recentPending._sum.amount || 0) - (recentPending._sum.amountPaid || 0),
        recentPendingCount: recentPending._count.id || 0,
      }
    };
  },
  ['insights-stats'],
  { tags: ['insights-stats'], revalidate: 3600 }
);

export async function getTopInsights(startDate?: Date, endDate?: Date) {
  const startStr = startDate ? startDate.toISOString() : 'default_start';
  const endStr = endDate ? endDate.toISOString() : 'default_end';
  return cachedGetTopInsights(startStr, endStr);
}
