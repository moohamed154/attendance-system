'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PaymentStatus } from '@prisma/client';
import { logActivity } from './activity';
import { getSession } from '@/lib/auth';

export async function getPayments(query?: string, status?: string, month?: string) {
  const where: any = {};
  
  if (query) {
    where.student = {
      OR: [
        { name: { contains: query } },
        { studentId: { contains: query } }
      ]
    };
  }
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (month && month !== 'all') {
    where.month = parseInt(month);
  }

  return await prisma.payment.findMany({
    where,
    include: {
      student: true,
      transactions: {
        orderBy: { date: 'desc' },
        include: { recordedBy: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createPayment(data: {
  studentId: string;
  amount: number;
  month: number;
  year: number;
  notes?: string;
  initialPaidAmount?: number;
  paymentMethod?: string;
  receiptNumber?: string;
}) {
  try {
    const authSession = await getSession();
    
    let status: PaymentStatus = 'UNPAID';
    let paidAt = null;
    const initialPaid = data.initialPaidAmount || 0;

    if (initialPaid >= data.amount) {
      status = 'PAID';
      paidAt = new Date();
    } else if (initialPaid > 0) {
      status = 'PARTIAL';
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        amountPaid: initialPaid,
        month: data.month,
        year: data.year,
        status,
        notes: data.notes,
        paidAt,
        ...(initialPaid > 0 && {
          transactions: {
            create: {
              amount: initialPaid,
              paymentMethod: data.paymentMethod,
              receiptNumber: data.receiptNumber,
              recordedById: authSession?.id as string | undefined,
              date: new Date()
            }
          }
        })
      },
      include: { student: true }
    });

    await logActivity('Payment Created', `Student: ${payment.student.name} - Due: ${data.amount}, Paid: ${initialPaid} for ${data.month}/${data.year}`);

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard/students');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create payment record' };
  }
}

export async function recordTransaction(data: {
  paymentId: string;
  amount: number;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  date?: Date;
}) {
  try {
    const authSession = await getSession();
    
    // Run in a transaction to ensure integrity
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ 
        where: { id: data.paymentId },
        include: { student: true }
      });
      
      if (!payment) throw new Error('Payment not found');

      // Create transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          receiptNumber: data.receiptNumber,
          notes: data.notes,
          recordedById: authSession?.id as string | undefined,
          date: data.date || new Date(),
        }
      });

      // Update payment totals
      const newAmountPaid = (payment.amountPaid || 0) + data.amount;
      let newStatus: PaymentStatus = 'PARTIAL';
      let paidAt = payment.paidAt;

      if (newAmountPaid >= payment.amount) {
        newStatus = 'PAID';
        paidAt = paidAt || new Date(); // Only set if not already set
      } else if (newAmountPaid <= 0) {
        newStatus = 'UNPAID';
        paidAt = null;
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
          paidAt
        }
      });

      return { payment, newAmountPaid, newStatus };
    });

    await logActivity(
      'Transaction Recorded', 
      `Student: ${result.payment.student.name} paid ${data.amount}. Total Paid: ${result.newAmountPaid}/${result.payment.amount}`
    );

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to record transaction:', error);
    return { error: error.message || 'Failed to record transaction' };
  }
}

// Backwards compatibility or quick overrides
export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id }, include: { student: true } });
    if (!payment) return { error: 'Not found' };

    await prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
        // If they force status to PAID, we assume amountPaid = amount
        amountPaid: status === 'PAID' ? payment.amount : (status === 'UNPAID' ? 0 : payment.amountPaid)
      }
    });

    await logActivity('Payment Status Updated', `Student: ${payment.student.name} - Marked as ${status}`);

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update status' };
  }
}

export async function updatePayment(id: string, data: {
  amount: number;
  month: number;
  year: number;
  status: PaymentStatus;
  notes?: string;
}) {
  try {
    const existing = await prisma.payment.findUnique({ where: { id }, include: { student: true } });
    const paidAt = data.status === 'PAID' 
      ? (existing?.status === 'PAID' ? existing.paidAt : new Date())
      : null;

    let amountPaid = existing?.amountPaid || 0;
    if (data.status === 'PAID') amountPaid = data.amount;
    if (data.status === 'UNPAID') amountPaid = 0;

    await prisma.payment.update({
      where: { id },
      data: {
        amount: data.amount,
        amountPaid,
        month: data.month,
        year: data.year,
        status: data.status,
        notes: data.notes,
        paidAt,
      }
    });

    if (existing) {
      await logActivity('Payment Edited', `Student: ${existing.student.name} - ${data.amount} for ${data.month}/${data.year}`);
    }

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update payment' };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { payment: { include: { student: true } } }
    });
    
    if (!transaction) return { error: 'Transaction not found' };

    await prisma.$transaction(async (tx) => {
      // Delete it
      await tx.paymentTransaction.delete({ where: { id: transactionId } });

      // Recalculate payment
      const payment = transaction.payment;
      const newAmountPaid = (payment.amountPaid || 0) - transaction.amount;
      
      let newStatus: PaymentStatus = 'PARTIAL';
      let paidAt = payment.paidAt;

      if (newAmountPaid <= 0) {
        newStatus = 'UNPAID';
        paidAt = null;
      } else if (newAmountPaid >= payment.amount) {
        newStatus = 'PAID';
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { amountPaid: newAmountPaid, status: newStatus, paidAt }
      });
    });

    await logActivity('Transaction Deleted', `Student: ${transaction.payment.student.name} - Removed payment of ${transaction.amount}`);

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard/students');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete transaction' };
  }
}

export async function deletePayment(id: string) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id }, include: { student: true } });
    if (payment) {
      await logActivity('Payment Deleted', `Student: ${payment.student.name} - ${payment.amount} for ${payment.month}/${payment.year}`);
    }

    // Cascade delete will handle transactions if configured in schema. prisma uses onDelete: Cascade
    await prisma.payment.delete({
      where: { id },
    });
    
    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete payment' };
  }
}

export async function generateMonthlyDues(month: number, year: number) {
  try {
    const activeStudents = await prisma.student.findMany({
      where: { isArchived: false },
    });

    let created = 0;
    let skipped = 0;

    for (const student of activeStudents) {
      const existing = await prisma.payment.findFirst({
        where: { studentId: student.id, month, year }
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.payment.create({
        data: {
          studentId: student.id,
          amount: student.monthlyFee || 0,
          amountPaid: 0,
          month,
          year,
          status: 'UNPAID',
        }
      });
      created++;
    }
    
    await logActivity('Generated Monthly Dues', `Created ${created} dues for ${month}/${year}`);

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard');
    return { success: true, created, skipped };
  } catch (error) {
    return { error: 'Failed to generate monthly dues' };
  }
}
