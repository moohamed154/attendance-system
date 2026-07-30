import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export interface StudentPaymentStatus {
  studentId: string;
  paymentId: string | null;
  amount: number;
  amountPaid: number;
  remaining: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  isPaid: boolean;
  notes: string | null;
  hasNotes: boolean;
}

/**
 * Pure business logic for calculating payment status, remaining amount, and notes presence.
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR PAYMENT STATUS CALCULATION ACROSS THE APP.
 */
export function calculatePaymentStatus(
  paymentRecord: {
    id?: string;
    amount: number;
    amountPaid?: number | null;
    status?: string;
    notes?: string | null;
  } | null | undefined,
  defaultMonthlyFee: number = 0,
  studentId: string = ''
): StudentPaymentStatus {
  const amount = paymentRecord ? paymentRecord.amount : defaultMonthlyFee;
  const amountPaid = paymentRecord ? (paymentRecord.amountPaid || 0) : 0;
  const remaining = Math.max(0, amount - amountPaid);
  
  const rawNotes = paymentRecord?.notes ? paymentRecord.notes.trim() : null;
  const notes = rawNotes && rawNotes.length > 0 ? rawNotes : null;
  const hasNotes = notes !== null;

  let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
  if (remaining === 0) {
    status = 'PAID';
  } else if (amountPaid > 0) {
    status = 'PARTIAL';
  } else {
    status = 'UNPAID';
  }

  return {
    studentId,
    paymentId: paymentRecord?.id || null,
    amount,
    amountPaid,
    remaining,
    status,
    isPaid: remaining === 0,
    notes,
    hasNotes,
  };
}

/**
 * Single shared service function to get payment status for a specific student, month, and year.
 * Both Attendance and Payments pages use this exact function.
 */
export async function getCurrentStudentPaymentStatus(
  studentId: string,
  month?: number,
  year?: number
): Promise<StudentPaymentStatus> {
  const now = dayjs();
  const targetMonth = month !== undefined ? month : now.month() + 1;
  const targetYear = year !== undefined ? year : now.year();

  const payment = await prisma.payment.findUnique({
    where: {
      studentId_month_year: {
        studentId,
        month: targetMonth,
        year: targetYear,
      },
    },
  });

  let defaultMonthlyFee = 0;
  if (!payment) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { monthlyFee: true },
    });
    defaultMonthlyFee = student?.monthlyFee || 0;
  }

  return calculatePaymentStatus(payment, defaultMonthlyFee, studentId);
}

/**
 * Batch version to get payment statuses for multiple students for a specific month and year.
 */
export async function getBatchStudentsPaymentStatus(
  studentIds: string[],
  month: number,
  year: number
): Promise<Map<string, StudentPaymentStatus>> {
  const resultMap = new Map<string, StudentPaymentStatus>();
  if (studentIds.length === 0) return resultMap;

  // 1. Fetch payments for all requested students
  const payments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      month,
      year,
    },
  });

  const paymentMap = new Map<string, typeof payments[0]>();
  payments.forEach((p) => paymentMap.set(p.studentId, p));

  // 2. Identify students without a payment record
  const missingStudentIds = studentIds.filter((id) => !paymentMap.has(id));

  const studentFeeMap = new Map<string, number>();
  if (missingStudentIds.length > 0) {
    const students = await prisma.student.findMany({
      where: { id: { in: missingStudentIds } },
      select: { id: true, monthlyFee: true },
    });
    students.forEach((s) => studentFeeMap.set(s.id, s.monthlyFee || 0));
  }

  // 3. Construct status for each student
  studentIds.forEach((id) => {
    const payment = paymentMap.get(id);
    const defaultMonthlyFee = studentFeeMap.get(id) || 0;
    resultMap.set(id, calculatePaymentStatus(payment, defaultMonthlyFee, id));
  });

  return resultMap;
}
