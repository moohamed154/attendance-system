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
 * Get payment status for a specific student, month, and year.
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

  return calculatePaymentStatus(payment, studentId);
}

/**
 * Batch get payment statuses for multiple students for a specific month and year.
 */
export async function getBatchStudentsPaymentStatus(
  studentIds: string[],
  month: number,
  year: number
): Promise<Map<string, StudentPaymentStatus>> {
  const resultMap = new Map<string, StudentPaymentStatus>();
  if (studentIds.length === 0) return resultMap;

  console.log(`[Diagnostic B] Prisma Payment Query Params -> studentIds Count: ${studentIds.length}, Month: ${month} (type: ${typeof month}), Year: ${year} (type: ${typeof year})`);

  // Fetch subscriptions matching exact studentIds, month, and year
  const payments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      month,
      year,
    },
    include: { student: true }
  });

  console.log(`[Diagnostic B] Prisma Payment Query Returned -> Payments Count: ${payments.length}`);

  const paymentMap = new Map<string, typeof payments[0]>();
  payments.forEach((p) => {
    paymentMap.set(p.studentId, p);
    console.log(`[Diagnostic B] FOUND PAYMENT -> studentId (DB): ${p.studentId}, student.studentId (Excel ID): ${p.student?.studentId}, Payment ID: ${p.id}, Month: ${p.month}, Year: ${p.year}, Amount: ${p.amount}, Paid: ${p.amountPaid}, Status: ${p.status}`);
  });

  for (const id of studentIds) {
    const payment = paymentMap.get(id);
    if (!payment) {
      console.log(`[Diagnostic B] NO PAYMENT FOUND -> For student.id: ${id}, Month: ${month}, Year: ${year}`);
    }

    const studentObj = await prisma.student.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (studentObj) {
      const dupCount = await prisma.payment.count({
        where: { studentId: id, month, year }
      });
      console.log(`[Diagnostic C, D, E, F] Student: ${studentObj.name} | student.id: ${studentObj.id} | student.studentId (Excel ID): ${studentObj.studentId} | Dup Count for Month ${month}/Year ${year}: ${dupCount}`);
      console.log(`[Diagnostic F] All Subscriptions for ${studentObj.name} (${studentObj.studentId}):`, studentObj.payments.map(p => ({
        id: p.id,
        month: p.month,
        year: p.year,
        amount: p.amount,
        amountPaid: p.amountPaid,
        remaining: Math.max(0, p.amount - (p.amountPaid || 0)),
        status: p.status
      })));
    }

    const status = calculatePaymentStatus(payment, id);
    resultMap.set(id, status);

    console.log(
      `[Attendance Payment Log] Student ID: ${status.studentId} | Subscription ID: ${status.paymentId || 'NONE'} | Month: ${month} | Year: ${year} | Status: ${status.status} | Remaining: ${status.remaining ?? 'N/A'} | Paid: ${status.amountPaid ?? 'N/A'}`
    );
  }

  return resultMap;
}
