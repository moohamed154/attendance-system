'use server';

import { prisma } from '@/lib/prisma';
import { getSession as getAuthSession } from '@/lib/auth';
import { logActivity } from './activity';
import { revalidatePath } from 'next/cache';

// Smart Skip Rules check
function getSkipReason(student: any, existingIds: Set<string>): string | null {
  if (existingIds.has(student.id)) return 'Already Exists';
  if (student.isArchived) return 'Archived';
  if (student.status === 'INACTIVE') return 'Inactive';
  if (student.status === 'FROZEN') return 'Frozen';
  if (!student.monthlyFee || student.monthlyFee <= 0) return 'Missing Monthly Fee';
  if (!student.sessionId) return 'Missing Session';
  if (!student.grade) return 'Missing Grade';
  if (!student.teacherName) return 'Missing Teacher';
  return null;
}

export async function getNewMonthPreview(month: number, year: number) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

    // Safety check: is another generation running?
    const runningLock = await prisma.monthlyGenerationSnapshot.findFirst({
      where: { status: 'RUNNING' }
    });
    if (runningLock) return { error: 'Another monthly generation is currently running.' };

    // Month validation (Only Current or Next)
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const isCurrent = month === currentMonth && year === currentYear;
    const isNext = month === nextMonth && year === nextYear;
    if (!isCurrent && !isNext) {
      return { error: 'You can only generate subscriptions for the current or next month.' };
    }

    // 1. Get ALL students
    const allStudents = await prisma.student.findMany({
      include: { session: true }
    });

    if (allStudents.length === 0) return { error: 'No students exist in the system.' };

    // 2. Get existing subscriptions for the month
    const existingPayments = await prisma.payment.findMany({
      where: { month, year },
      select: { studentId: true }
    });
    const existingStudentIds = new Set(existingPayments.map(p => p.studentId));

    // Stats
    let activeStudents = 0;
    let archivedStudents = 0;
    let inactiveStudents = 0;
    let frozenStudents = 0;
    let studentsMissingFee = 0;
    let studentsWithoutSession = 0;
    let expectedRevenue = 0;
    
    const studentsToGenerate: string[] = [];
    const skippedDetails: any[] = [];
    const previewExportData: any[] = []; // For Excel/PDF

    for (const student of allStudents) {
      if (student.isArchived) archivedStudents++;
      else if (student.status === 'INACTIVE') inactiveStudents++;
      else if (student.status === 'FROZEN') frozenStudents++;
      else activeStudents++;

      const skipReason = getSkipReason(student, existingStudentIds);

      // Track specific missing fields for active students
      if (!student.isArchived && student.status !== 'INACTIVE' && student.status !== 'FROZEN') {
         if (!student.monthlyFee || student.monthlyFee <= 0) studentsMissingFee++;
         if (!student.sessionId) studentsWithoutSession++;
      }

      const willGenerate = !skipReason;
      
      previewExportData.push({
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        grade: student.grade || '-',
        session: student.session ? `${student.session.grade} - ${student.session.time}` : '-',
        teacher: student.teacherName || '-',
        fee: student.monthlyFee || 0,
        status: student.isArchived ? 'ARCHIVED' : (student.status || 'ACTIVE'),
        willGenerate,
        skipReason: skipReason || '-'
      });

      if (willGenerate) {
        studentsToGenerate.push(student.id);
        expectedRevenue += (student.monthlyFee || 0);
      } else {
        skippedDetails.push({ id: student.id, reason: skipReason });
      }
    }

    return {
      success: true,
      stats: {
        totalStudents: allStudents.length,
        activeStudents,
        archivedStudents,
        inactiveStudents,
        frozenStudents,
        alreadyExisting: existingStudentIds.size,
        toBeGenerated: studentsToGenerate.length,
        skippedStudents: skippedDetails.length,
        expectedRevenue,
        studentsMissingFee,
        studentsWithoutSession
      },
      studentsToGenerate,
      previewExportData,
      skippedDetails
    };
  } catch (error) {
    console.error('Error in getNewMonthPreview:', error);
    return { error: 'Failed to generate preview' };
  }
}

export async function lockGeneration(month: number, year: number) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const userId = await prisma.user.findUnique({ where: { username: (session as any).username as string } });

    // Check if any generation is running
    const running = await prisma.monthlyGenerationSnapshot.findFirst({ where: { status: 'RUNNING' } });
    if (running) return { error: 'Another generation is currently running.' };

    const snapshot = await prisma.monthlyGenerationSnapshot.upsert({
      where: { month_year: { month, year } },
      update: {
        status: 'RUNNING',
        startedAt: new Date(),
        completedAt: null,
        executionTime: null,
        generatedById: userId?.id
      },
      create: {
        month,
        year,
        status: 'RUNNING',
        generatedById: userId?.id
      }
    });

    return { success: true, snapshotId: snapshot.id };
  } catch (error) {
    console.error('Lock error:', error);
    return { error: 'Failed to acquire generation lock.' };
  }
}

export async function generateNewMonthChunk(month: number, year: number, studentIds: string[]) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

    if (!studentIds || studentIds.length === 0) return { success: true, count: 0, revenue: 0, failed: [] };

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } }
    });

    // Final safety check against duplicates
    const existingPayments = await prisma.payment.findMany({
      where: { studentId: { in: studentIds }, month, year },
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
      return { success: true, count: 0, revenue: 0, failed: [] };
    }

    // Try bulk insert. If it fails (e.g. some obscure DB error), fallback to iterative to capture failed IDs
    try {
      await prisma.payment.createMany({
        data: paymentsToCreate,
        skipDuplicates: true
      });
      const revenueAdded = paymentsToCreate.reduce((sum, p) => sum + p.amount, 0);
      return { success: true, count: paymentsToCreate.length, revenue: revenueAdded, failed: [] };
    } catch {
      console.warn('Bulk insert failed, falling back to iterative to track failures');
      let count = 0;
      let revenue = 0;
      const failed = [];
      for (const p of paymentsToCreate) {
        try {
          await prisma.payment.create({ data: p });
          count++;
          revenue += p.amount;
        } catch {
          failed.push(p.studentId);
        }
      }
      return { success: true, count, revenue, failed };
    }
  } catch (error: any) {
    console.error('Error generating month chunk:', error);
    return { error: 'An unexpected error occurred during generation.' };
  }
}

export async function finalizeNewMonthGeneration(month: number, year: number, stats: any, failedIds: string[], skippedDetails: any[]) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const snapshot = await prisma.monthlyGenerationSnapshot.update({
      where: { month_year: { month, year } },
      data: {
        status: failedIds.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
        completedAt: new Date(),
        executionTime: stats.time,
        studentCount: stats.totalStudents || 0,
        createdCount: stats.count || 0,
        skippedCount: stats.skipped || 0,
        failedCount: failedIds.length,
        archivedCount: stats.archived || 0,
        inactiveCount: stats.inactive || 0,
        frozenCount: stats.frozen || 0,
        expectedRevenue: stats.revenue || 0,
        failedStudents: JSON.stringify(failedIds),
        skippedDetails: JSON.stringify(skippedDetails)
      }
    });

    await logActivity(
      'Start New Month',
      `Month: ${month}/${year}`,
      `Generated ${stats.count} subscriptions. Failed: ${failedIds.length}. Skipped: ${stats.skipped}. Time: ${stats.time}ms. Snapshot: ${snapshot.id}`
    );

    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error finalizing generation:', error);
    // Release lock on fail
    await prisma.monthlyGenerationSnapshot.update({
      where: { month_year: { month, year } },
      data: { status: 'FAILED' }
    });
    return { error: 'Failed to finalize generation' };
  }
}

export async function unlockGeneration(month: number, year: number) {
  try {
    await prisma.monthlyGenerationSnapshot.update({
      where: { month_year: { month, year } },
      data: { status: 'FAILED' }
    });
    return { success: true };
  } catch {
    return { error: 'Failed to unlock' };
  }
}

export async function getGenerationHistory() {
  return prisma.monthlyGenerationSnapshot.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: { generatedBy: true }
  });
}

export async function retryFailedGeneration(snapshotId: string) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const snapshot = await prisma.monthlyGenerationSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot) return { error: 'Snapshot not found' };
    
    if (!snapshot.failedStudents) return { success: true, message: 'No failed students to retry' };
    const failedIds: string[] = JSON.parse(snapshot.failedStudents);
    if (failedIds.length === 0) return { success: true, message: 'No failed students to retry' };

    const res = await generateNewMonthChunk(snapshot.month, snapshot.year, failedIds);
    if (res.error) return res;

    const remainingFailed = res.failed || [];
    const newCreatedCount = snapshot.createdCount + (res.count || 0);
    const newRevenue = snapshot.expectedRevenue + (res.revenue || 0);

    await prisma.monthlyGenerationSnapshot.update({
      where: { id: snapshotId },
      data: {
        createdCount: newCreatedCount,
        failedCount: remainingFailed.length,
        expectedRevenue: newRevenue,
        failedStudents: JSON.stringify(remainingFailed),
        status: remainingFailed.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED'
      }
    });

    await logActivity(
      'Retry Failed Generation',
      `Month: ${snapshot.month}/${snapshot.year}`,
      `Retried ${failedIds.length} students. Success: ${res.count || 0}, Still failed: ${remainingFailed.length}`
    );

    revalidatePath('/dashboard/payments/generations');
    return { success: true, count: res.count, remainingFailed: remainingFailed.length };

  } catch (error) {
    console.error('Retry error:', error);
    return { error: 'Failed to retry records.' };
  }
}

export async function reopenMonthlyGeneration(snapshotId: string) {
  try {
    const session = await getAuthSession();
    if (session?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const snapshot = await prisma.monthlyGenerationSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot) return { error: 'Snapshot not found' };

    // Get preview for that month
    const preview = await getNewMonthPreview(snapshot.month, snapshot.year);
    if (preview.error) return preview;

    const studentsToGenerate = preview.studentsToGenerate;
    if (!studentsToGenerate || studentsToGenerate.length === 0) {
      return { success: true, message: 'No new students to generate subscriptions for.' };
    }

    // Generate them
    const res = await generateNewMonthChunk(snapshot.month, snapshot.year, studentsToGenerate);
    if (res.error) return res;

    const newCreatedCount = snapshot.createdCount + (res.count || 0);
    const newRevenue = snapshot.expectedRevenue + (res.revenue || 0);

    let failedIds: string[] = [];
    if (snapshot.failedStudents) {
      failedIds = JSON.parse(snapshot.failedStudents);
    }
    if (res.failed && res.failed.length > 0) {
      failedIds = [...failedIds, ...res.failed];
    }

    await prisma.monthlyGenerationSnapshot.update({
      where: { id: snapshotId },
      data: {
        createdCount: newCreatedCount,
        failedCount: failedIds.length,
        expectedRevenue: newRevenue,
        failedStudents: JSON.stringify(failedIds),
        status: failedIds.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED'
      }
    });

    await logActivity(
      'Reopen Monthly Generation',
      `Month: ${snapshot.month}/${snapshot.year}`,
      `Generated ${res.count} new subscriptions for recently added students. Revenue added: ${res.revenue}`
    );

    revalidatePath('/dashboard/payments/generations');
    return { success: true, count: res.count, revenue: res.revenue };

  } catch (error) {
    console.error('Reopen error:', error);
    return { error: 'Failed to reopen monthly generation.' };
  }
}
