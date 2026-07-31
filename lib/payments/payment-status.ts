import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export interface StudentPaymentStatus {
  studentId: string;
  paymentId: string | null;
  amount: number | null;
  amountPaid: number | null;
  remaining: number | null;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'NO_SUBSCRIPTION';
  isPaid: boolean;
  hasSubscription: boolean;
  notes: string | null;
  hasNotes: boolean;
}

/**
 * Pure business logic for calculating payment status.
 * SINGLE SOURCE OF TRUTH FOR PAYMENT STATUS CALCULATION ACROSS THE APP.
 * 
 * If paymentRecord is null/undefined, status is NO_SUBSCRIPTION (not unpaid).
 * We NEVER fabricate a remaining balance from student.monthlyFee when no subscription exists.
 */
export function calculatePaymentStatus(
  paymentRecord: {
    id?: string;
    amount: number;
    amountPaid?: number | null;
    status?: string;
    notes?: string | null;
  } | null | undefined,
  studentId: string = ''
): StudentPaymentStatus {
  if (!paymentRecord) {
    return {
      studentId,
      paymentId: null,
      amount: null,
      amountPaid: null,
      remaining: null,
      status: 'NO_SUBSCRIPTION',
      isPaid: false,
      hasSubscription: false,
      notes: null,
      hasNotes: false,
    };
  }

  const amount = paymentRecord.amount;
  const amountPaid = paymentRecord.amountPaid || 0;
  const remaining = Math.max(0, amount - amountPaid);
  
  const rawNotes = paymentRecord.notes ? paymentRecord.notes.trim() : null;
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
    paymentId: paymentRecord.id || null,
    amount,
    amountPaid,
    remaining,
    status,
    isPaid: remaining === 0,
    hasSubscription: true,
    notes,
    hasNotes,
  };
}

/**
 * SINGLE SOURCE OF TRUTH HELPER FOR A SINGLE STUDENT MONTHLY PAYMENT QUERY.
 * Both Attendance and Payments pages use this helper or its batch equivalent.
 * 
 * Given studentId (Prisma CUID), month (Int), and year (Int),
 * queries the exact unique Payment record from PostgreSQL.
 */
export async function getStudentPaymentForMonth(
  studentId: string,
  month: number,
  year: number
): Promise<StudentPaymentStatus> {
  const payment = await prisma.payment.findUnique({
    where: {
      studentId_month_year: {
        studentId,
        month,
        year,
      },
    },
  });

  return calculatePaymentStatus(payment, studentId);
}

/**
 * Get payment status for a specific student, defaulting to current month/year if omitted.
 */
export async function getCurrentStudentPaymentStatus(
  studentId: string,
  month?: number,
  year?: number
): Promise<StudentPaymentStatus> {
  const now = dayjs();
  const targetMonth = month !== undefined ? month : now.month() + 1;
  const targetYear = year !== undefined ? year : now.year();

  return getStudentPaymentForMonth(studentId, targetMonth, targetYear);
}

/**
 * Batch get payment statuses for multiple students for a specific month and year.
 * Executed by Attendance page to perform a single batch query for all session students.
 */
export async function getBatchStudentsPaymentStatus(
  studentIds: string[],
  month: number,
  year: number
): Promise<Map<string, StudentPaymentStatus>> {
  const resultMap = new Map<string, StudentPaymentStatus>();
  if (studentIds.length === 0) return resultMap;

  const payments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      month,
      year,
    },
  });

  const paymentMap = new Map<string, typeof payments[0]>();
  payments.forEach((p) => paymentMap.set(p.studentId, p));

  studentIds.forEach((id) => {
    const payment = paymentMap.get(id);
    const status = calculatePaymentStatus(payment, id);
    resultMap.set(id, status);
  });

  return resultMap;
}
