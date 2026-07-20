'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import { isValidEgyptianPhone, EGYPTIAN_PHONE_ERROR_MESSAGE_AR, EGYPTIAN_PHONE_ERROR_MESSAGE_EN } from '@/lib/validations';

export async function getStudents(
  query?: string, 
  grade?: string, 
  sessionId?: string,
  skip?: number,
  take?: number,
  isArchived: boolean = false
) {
  const where: Prisma.StudentWhereInput = { isArchived };
  
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { studentId: { contains: query } },
      { studentPhone: { contains: query } },
      { parentPhone: { contains: query } }
    ];
  }
  
  if (grade && grade !== 'all') {
    where.grade = grade;
  }
  
  if (sessionId && sessionId !== 'all') {
    where.sessionId = sessionId === 'none' ? null : sessionId;
  }

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        session: true
      },
      orderBy: { name: 'asc' },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    }),
    prisma.student.count({ where })
  ]);

  return { data, total };
}

export async function getStudentById(id: string) {
  return await prisma.student.findUnique({
    where: { id },
    include: {
      session: true,
      attendances: {
        include: { session: true },
        orderBy: { date: 'desc' }
      },
      payments: {
        include: {
          transactions: {
            orderBy: { date: 'desc' }
          }
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      }
    }
  });
}

export async function createStudent(data: {
  studentId: string;
  name: string;
  studentPhone: string;
  parentPhone?: string | null;
  grade: string;
  sessionId: string;
  studentType: string;
  monthlyFee?: number | null;
  importMonth?: string;
  notes?: string;
}) {
  try {
    // Auto-generate password hash from studentId (Excel ID) as default password
    const studentPhone = data.studentPhone.trim();
    const parentPhone = data.parentPhone?.trim() || null;

    if (!isValidEgyptianPhone(studentPhone)) {
      return { error: EGYPTIAN_PHONE_ERROR_MESSAGE_AR };
    }

    if (parentPhone && !isValidEgyptianPhone(parentPhone)) {
      return { error: EGYPTIAN_PHONE_ERROR_MESSAGE_AR };
    }

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(data.studentId, 10);

    const student = await prisma.student.create({
      data: {
        studentId: data.studentId,
        name: data.name,
        studentPhone: studentPhone,
        parentPhone: parentPhone,
        grade: data.grade,
        sessionId: data.sessionId,
        studentType: data.studentType,
        monthlyFee: data.monthlyFee,
        importMonth: data.importMonth,
        notes: data.notes,
        passwordHash,
        mustChangePassword: true,
      }
    });
    
    // Create Payment for current month (price is null, so UNPAID)
    const currentDate = new Date();
    await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: data.monthlyFee || 0,
        amountPaid: 0,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        status: 'UNPAID',
      }
    });

    await logActivity('Student Created', `Student: ${data.name} (${data.studentId})`);

    revalidatePath('/dashboard/students');
    return { success: true, data: student };
  } catch (error: any) {
    logger.error('Failed to create student', 'createStudent', { error: String(error) });
    if (error.code === 'P2002' && error.meta?.target?.includes('studentPhone')) {
      return { error: 'Student Phone Number is already in use.' };
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('studentId')) {
      return { error: 'Student ID is already in use.' };
    }
    return { error: 'Failed to create student' };
  }
}

export async function updateStudent(id: string, data: {
  name?: string;
  studentPhone?: string;
  parentPhone?: string | null;
  grade?: string;
  studentType?: string;
  monthlyFee?: number | null;
  importMonth?: string;
  notes?: string;
  sessionId?: string;
}) {
  const { sessionId, ...rest } = data;
  try {
    let finalStudentPhone = data.studentPhone?.trim();
    let finalParentPhone = data.parentPhone?.trim() || null;

    if (finalStudentPhone !== undefined) {
      if (!isValidEgyptianPhone(finalStudentPhone)) {
        return { error: EGYPTIAN_PHONE_ERROR_MESSAGE_AR };
      }
      rest.studentPhone = finalStudentPhone;
    }

    if (finalParentPhone !== null && finalParentPhone !== undefined) {
      if (!isValidEgyptianPhone(finalParentPhone)) {
        return { error: EGYPTIAN_PHONE_ERROR_MESSAGE_AR };
      }
      rest.parentPhone = finalParentPhone;
    } else if (finalParentPhone === null && data.parentPhone !== undefined) {
      rest.parentPhone = null;
    }

    const updateData: Prisma.StudentUpdateInput = { ...rest };
    if (sessionId !== undefined) {
      updateData.session = { connect: { id: sessionId } };
    }
    const student = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    if (data.monthlyFee !== undefined) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const existingPayment = await prisma.payment.findFirst({
        where: {
          studentId: id,
          month: currentMonth,
          year: currentYear,
        }
      });

      // Just update the amount due, don't auto-mark as PAID/UNPAID based on fee presence in new model
      if (existingPayment) {
        let newStatus = existingPayment.status;
        if (existingPayment.amountPaid !== null && existingPayment.amountPaid >= (data.monthlyFee || 0) && (data.monthlyFee || 0) > 0) {
          newStatus = 'PAID';
        } else if (existingPayment.amountPaid !== null && existingPayment.amountPaid > 0) {
          newStatus = 'PARTIAL';
        } else {
          newStatus = 'UNPAID';
        }

        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: data.monthlyFee || 0,
            status: newStatus,
          }
        });
      } else {
        await prisma.payment.create({
          data: {
            studentId: id,
            amount: data.monthlyFee || 0,
            amountPaid: 0,
            month: currentMonth,
            year: currentYear,
            status: 'UNPAID',
            paidAt: null,
          }
        });
      }
    }

    await logActivity('Student Updated', `Student: ${student.name} (${student.studentId})`);

    revalidatePath('/dashboard/students');
    return { success: true, data: student };
  } catch (error: any) {
    logger.error('Failed to update student', 'updateStudent', { error: String(error) });
    if (error.code === 'P2002' && error.meta?.target?.includes('studentPhone')) {
      return { error: 'Student Phone Number is already in use.' };
    }
    return { error: 'Failed to update student' };
  }
}

export async function deleteStudent(id: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        studentId: true,
        isArchived: true,
        _count: {
          select: { attendances: true, payments: true }
        }
      }
    });

    if (!student) return { error: 'Student not found' };

    if (student._count.attendances > 0 || student._count.payments > 0) {
      await prisma.student.update({
        where: { id },
        data: { isArchived: true }
      });
      await logActivity('Student Archived', `Student: ${student.name} (${student.studentId})`);
      revalidatePath('/dashboard/students');
      return { success: true, archived: true };
    }

    await prisma.student.delete({ where: { id } });
    await logActivity('Student Deleted', `Student: ${student.name} (${student.studentId})`);
    revalidatePath('/dashboard/students');
    return { success: true, archived: false };
  } catch (error) {
    logger.error('Failed to delete student', 'deleteStudent', { error: String(error) });
    return { error: 'Failed to delete student' };
  }
}

export async function restoreStudent(id: string) {
  try {
    const authSession = await getSession();
    if (authSession?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const student = await prisma.student.update({
      where: { id },
      data: { isArchived: false }
    });

    await logActivity('Student Restored', `Student: ${student.name} (${student.studentId})`);
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/students/archived');
    return { success: true };
  } catch (error) {
    logger.error('Failed to restore student', 'restoreStudent', { error: String(error) });
    return { error: 'Failed to restore student' };
  }
}

export async function hardDeleteStudent(id: string) {
  try {
    const authSession = await getSession();
    if (authSession?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        studentId: true,
        _count: { select: { attendances: true } }
      }
    });

    if (!student) return { error: 'Student not found' };

    if (student._count.attendances > 0) {
      return { error: 'Cannot permanently delete a student with attendance records.' };
    }

    await prisma.student.delete({ where: { id } });
    await logActivity('Student Permanently Deleted', `Student: ${student.name} (${student.studentId})`);
    
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/students/archived');
    return { success: true };
  } catch (error) {
    logger.error('Failed to hard delete student', 'hardDeleteStudent', { error: String(error) });
    return { error: 'Failed to hard delete student' };
  }
}

export async function lookupStudent(studentId: string) {
  try {
    if (!studentId || typeof studentId !== 'string') {
      return { error: 'Invalid Student ID format' };
    }
    const idClean = studentId.trim();
    if (!idClean) return { error: 'Student ID is required' };

    const student = await prisma.student.findFirst({
      where: {
        studentId: idClean,
        isArchived: false
      },
      select: {
        id: true
      }
    });

    if (!student) {
      return { error: 'Student not found' };
    }

    const { encryptStudentToken } = await import('@/lib/qr/token');
    const token = encryptStudentToken(student.id);
    return { success: true, token };
  } catch (error) {
    logger.error('Failed to lookup student', 'lookupStudent', { error: String(error) });
    return { error: 'An unexpected error occurred' };
  }
}

