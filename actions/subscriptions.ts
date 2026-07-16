'use server';

import { prisma } from '@/lib/prisma';
import { getSession as getAuthSession } from '@/lib/auth';
import { logActivity } from './activity';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';

export async function getNewMonthPreview(month: number, year: number) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    // 1. Get all active students
    const allActiveStudents = await prisma.student.findMany({
      where: {
        isArchived: false,
        status: { not: 'ARCHIVED' } // Just in case status is used instead of isArchived
      },
      include: {
        session: true
      }
    });

    const activeStudentsCount = allActiveStudents.length;

    // 2. Get students who already have a subscription for this month
    const existingPayments = await prisma.payment.findMany({
      where: {
        month,
        year,
        student: {
          isArchived: false
        }
      },
      select: { studentId: true }
    });

    const existingStudentIds = new Set(existingPayments.map(p => p.studentId));
    
    // 3. Students to be generated
    const studentsToGenerate = allActiveStudents.filter(s => !existingStudentIds.has(s.id));
    
    // 4. Archived students (just for stats)
    const archivedStudentsCount = await prisma.student.count({
      where: { isArchived: true }
    });

    // Calculate Financials
    let expectedRevenue = 0;
    let highestFee = 0;
    let lowestFee = Infinity;
    let totalFees = 0;
    let studentsMissingFee = 0;
    let studentsWithoutSession = 0;

    for (const student of studentsToGenerate) {
      const fee = student.monthlyFee || 0;
      if (!student.monthlyFee) studentsMissingFee++;
      if (!student.sessionId) studentsWithoutSession++;
      
      expectedRevenue += fee;
      totalFees += fee;
      if (fee > highestFee) highestFee = fee;
      if (fee < lowestFee && fee > 0) lowestFee = fee;
    }

    if (lowestFee === Infinity) lowestFee = 0;
    const averageFee = studentsToGenerate.length > 0 ? Math.round(totalFees / studentsToGenerate.length) : 0;

    return {
      success: true,
      stats: {
        activeStudents: activeStudentsCount,
        archivedStudents: archivedStudentsCount,
        alreadyExisting: existingStudentIds.size,
        toBeGenerated: studentsToGenerate.length,
        skippedStudents: existingStudentIds.size, // Basically students already having subscription
        expectedRevenue,
        expectedSubscriptions: studentsToGenerate.length,
        averageFee,
        highestFee,
        lowestFee,
        studentsMissingFee,
        studentsWithoutSession
      },
      studentsToGenerate: studentsToGenerate.map(s => s.id) // Return IDs to client for chunking
    };
  } catch (error) {
    console.error('Error in getNewMonthPreview:', error);
    return { error: 'Failed to generate preview' };
  }
}

export async function generateNewMonthChunk(month: number, year: number, studentIds: string[]) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    if (!studentIds || studentIds.length === 0) {
      return { success: true, count: 0, revenue: 0 };
    }

    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        isArchived: false
      }
    });

    // To prevent duplicate errors due to race conditions or previous runs:
    const existingPayments = await prisma.payment.findMany({
      where: {
        studentId: { in: studentIds },
        month,
        year
      },
      select: { studentId: true }
    });
    
    const existingIds = new Set(existingPayments.map(p => p.studentId));
    
    const paymentsToCreate = students
      .filter(s => !existingIds.has(s.id))
      .map(student => ({
        studentId: student.id,
        amount: student.monthlyFee || 0,
        amountPaid: 0,
        month,
        year,
        status: 'UNPAID' as any,
      }));

    if (paymentsToCreate.length === 0) {
      return { success: true, count: 0, revenue: 0 };
    }

    // Perform bulk insert
    await prisma.$transaction(async (tx) => {
      await tx.payment.createMany({
        data: paymentsToCreate
      });
    });

    const revenueAdded = paymentsToCreate.reduce((sum, p) => sum + p.amount, 0);

    return { success: true, count: paymentsToCreate.length, revenue: revenueAdded };
  } catch (error: any) {
    console.error('Error generating month chunk:', error);
    // Return friendly error if unique constraint fails
    if (error.code === 'P2002') {
      return { error: 'A subscription already exists for one or more students in this chunk.' };
    }
    return { error: 'An unexpected error occurred during generation.' };
  }
}

export async function finalizeNewMonthGeneration(month: number, year: number, stats: any) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    await logActivity(
      'Start New Month',
      `Month: ${month}/${year}`,
      `Generated ${stats.count} subscriptions with expected revenue ${stats.revenue}. Skipped: ${stats.skipped}. Time: ${stats.time}ms`
    );

    revalidatePath('/dashboard', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Error finalizing generation:', error);
    return { error: 'Failed to finalize generation' };
  }
}
