'use server';

import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function getAttendanceStats(startDate?: Date, endDate?: Date) {
  // Default to last 30 days if no range provided
  const start = startDate || dayjs().subtract(30, 'days').toDate();
  const end = endDate || dayjs().toDate();
  
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
}

export async function getPaymentStats(startDate?: Date, endDate?: Date) {
  // If date range is within a year, we can show months or days
  const start = startDate || dayjs().startOf('year').toDate();
  const end = endDate || dayjs().endOf('year').toDate();
  
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
}

export async function getTopInsights(startDate?: Date, endDate?: Date) {
  const start = startDate || dayjs().subtract(30, 'days').toDate();
  const end = endDate || dayjs().toDate();
  
  // Most absent students
  const absentRecords = await prisma.attendance.groupBy({
    by: ['studentId'],
    where: { status: 'ABSENT', date: { gte: start, lte: end }, isArchived: false },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const mostAbsent = await Promise.all(
    absentRecords.map(async (rec) => {
      const student = await prisma.student.findUnique({ where: { id: rec.studentId }, select: { name: true } });
      return { name: student?.name || 'Unknown', absences: rec._count.id };
    })
  );

  // Best attendance
  const presentRecords = await prisma.attendance.groupBy({
    by: ['studentId'],
    where: { status: 'PRESENT', date: { gte: start, lte: end }, isArchived: false },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const bestAttendance = await Promise.all(
    presentRecords.map(async (rec) => {
      const student = await prisma.student.findUnique({ where: { id: rec.studentId }, select: { name: true } });
      return { name: student?.name || 'Unknown', present: rec._count.id };
    })
  );

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
}
