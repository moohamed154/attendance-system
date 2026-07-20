'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signStudentToken, setStudentSession, clearStudentSession, getStudentSession } from '@/lib/student-auth';
import * as bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function studentLoginAction(prevState: { error?: string } | null, formData: FormData) {
  try {
    const limiter = await rateLimit('student-login', 5, 60 * 1000);
    if (!limiter.success) {
      return { error: `Too many login attempts. Please try again in ${limiter.reset} seconds.` };
    }

    const data = Object.fromEntries(formData);
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
      return { error: 'Invalid phone number or password format' };
    }

    const { phone, password } = parsed.data;

    // Find student by phone number
    const student = await prisma.student.findFirst({
      where: {
        studentPhone: phone.trim(),
        isArchived: false,
      },
    });

    if (!student) {
      return { error: 'Invalid phone number or password' };
    }

    if (!student.passwordHash) {
      return { error: 'Account not set up. Please contact your teacher.' };
    }

    const passwordMatch = await bcrypt.compare(password, student.passwordHash);
    if (!passwordMatch) {
      return { error: 'Invalid phone number or password' };
    }

    // Update last login
    await prisma.student.update({
      where: { id: student.id },
      data: { lastLogin: new Date() },
    });

    const token = await signStudentToken({
      studentDbId: student.id,
      studentId: student.studentId,
      name: student.name,
      mustChangePassword: student.mustChangePassword,
    });

    await setStudentSession(token);
  } catch (error) {
    logger.error('Student login error', 'studentLoginAction', { error: String(error) });
    return { error: 'An unexpected error occurred' };
  }

  // Redirect must be outside try-catch
  const session = await getStudentSession();
  if (session?.mustChangePassword) {
    redirect('/student/change-password');
  }
  redirect('/student');
}

export async function studentLogoutAction() {
  await clearStudentSession();
  redirect('/student/login');
}

export async function studentChangePasswordAction(prevState: { error?: string; success?: boolean } | null, formData: FormData): Promise<{ error?: string; success?: boolean } | null> {
  try {
    const session = await getStudentSession();
    if (!session) {
      redirect('/student/login');
    }

    const data = Object.fromEntries(formData);
    const parsed = changePasswordSchema.safeParse(data);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError.message };
    }

    const { currentPassword, newPassword } = parsed.data;

    const student = await prisma.student.findUnique({
      where: { id: session.studentDbId },
    });

    if (!student || !student.passwordHash) {
      return { error: 'Student account not found' };
    }

    // Only verify current password when this is a VOLUNTARY change (not forced on first login).
    // On forced change the student already authenticated moments ago — no need to re-enter old PW.
    if (!session.mustChangePassword) {
      if (!currentPassword) {
        return { error: 'Current password is required' };
      }
      const currentPasswordMatch = await bcrypt.compare(currentPassword, student.passwordHash);
      if (!currentPasswordMatch) {
        return { error: 'Current password is incorrect' };
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: student.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    // Re-issue token with mustChangePassword = false
    const newToken = await signStudentToken({
      studentDbId: student.id,
      studentId: student.studentId,
      name: student.name,
      mustChangePassword: false,
    });

    await setStudentSession(newToken);
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    logger.error('Change password error', 'studentChangePasswordAction', { error: String(error) });
    return { error: 'An unexpected error occurred' };
  }

  redirect('/student');
}
