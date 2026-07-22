'use server';

import { prisma } from '@/lib/prisma';
import { generateReservationQRToken } from '@/lib/qr/reservation-token';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';
import crypto from 'crypto';

export interface PublicReservationInput {
  studentName: string;
  parentName: string;
  parentPhone: string;
  studentPhone?: string;
  grade: string;
  school?: string;
  sessionId: string;
  notes?: string;
}

export interface EditReservationBeforePaymentInput {
  reservationNumber: string;
  trackingCode: string;
  parentName?: string;
  studentPhone?: string;
  school?: string;
  notes?: string;
}

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function generateTrackingCode(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
}

function generateReservationNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  return `RES-${dateStr}-${randomSuffix}`;
}

export async function getPublicSessions(grade?: string, subject?: string) {
  try {
    const where: any = { isArchived: false, status: { not: 'HIDDEN' } };
    if (grade) where.grade = grade;
    if (subject && subject !== 'ALL') where.subject = subject;

    const sessions = await prisma.session.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
    });

    return { success: true, data: sessions };
  } catch (error: any) {
    logger.error('Failed to get public sessions', { error: error.message });
    return { success: false, error: 'Failed to fetch sessions.' };
  }
}

export async function createPublicReservation(input: PublicReservationInput) {
  try {
    const { studentName, parentName, parentPhone, studentPhone, grade, school, sessionId, notes } = input;
    const actualParentName = parentName?.trim() || studentName.trim();

    if (!studentName?.trim() || !parentPhone?.trim() || !sessionId) {
      return { success: false, error: 'Student name, parent phone, and session are required.' };
    }

    const cleanParentPhone = sanitizePhone(parentPhone);
    const cleanStudentPhone = studentPhone ? sanitizePhone(studentPhone) : null;

    if (cleanStudentPhone && cleanStudentPhone === cleanParentPhone) {
      return {
        success: false,
        error: 'Student phone number cannot be identical to parent phone number. Please enter distinct numbers or leave student phone blank.',
      };
    }

    const normalizedStudentName = studentName.trim().toLowerCase();

    // Priority Duplicate Validation Cases
    const existingParentStudents = await prisma.student.findMany({
      where: { parentPhone: cleanParentPhone },
      include: {
        reservations: {
          where: { status: { in: ['PENDING', 'CONFIRMED'] } },
          include: { session: true },
        },
      },
    });

    const exactDuplicateStudent = existingParentStudents.find(
      (s) => s.name.trim().toLowerCase() === normalizedStudentName
    );

    if (exactDuplicateStudent) {
      const activeRes = exactDuplicateStudent.reservations[0];
      return {
        success: false,
        code: 'DUPLICATE_EXACT',
        error: 'This student already exists with the same parent phone number.',
        duplicateStudent: {
          name: exactDuplicateStudent.name,
          parentPhone: exactDuplicateStudent.parentPhone,
          grade: exactDuplicateStudent.grade,
          reservationNumber: activeRes?.reservationNumber || null,
          status: activeRes?.status || null,
        },
      };
    }

    let siblingNotice = false;
    if (existingParentStudents.length > 0) {
      siblingNotice = true;
    }

    let nameOnlyWarning = false;
    if (!siblingNotice) {
      const sameNameDiffPhone = await prisma.student.findFirst({
        where: {
          name: { equals: studentName.trim(), mode: 'insensitive' },
          parentPhone: { not: cleanParentPhone },
        },
      });
      if (sameNameDiffPhone) {
        nameOnlyWarning = true;
      }
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.isArchived || session.status === 'CLOSED') {
      return { success: false, error: 'The selected session is no longer available for booking.' };
    }

    if ((session.reservedSeats || 0) >= (session.capacity || 30)) {
      return { success: false, error: 'This session is fully booked.' };
    }

    let student: any = exactDuplicateStudent || null;
    if (!student) {
      const existingByPhone = await prisma.student.findFirst({
        where: { studentPhone: sanitizePhone(studentPhone || cleanParentPhone) },
      });

      if (existingByPhone) {
        student = existingByPhone;
      } else {
        const studentId = `STU${Date.now().toString().slice(-6)}`;
        student = await prisma.student.create({
          data: {
            studentId,
            name: studentName.trim(),
            parentPhone: cleanParentPhone,
            studentPhone: sanitizePhone(studentPhone || cleanParentPhone),
            grade: grade || session.grade,
            studentType: 'GENERAL',
            school: school || null,
            notes: notes || null,
          },
        });
      }
    }

    if (!student) {
      return { success: false, error: 'Failed to register or find student.' };
    }

    const reservationNumber = generateReservationNumber();
    const trackingCode = generateTrackingCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const qrToken = generateReservationQRToken({
      reservationId: reservationNumber,
      reservationNumber,
      studentId: student.id,
      sessionId: session.id,
      status: 'PENDING',
      timestamp: Date.now(),
    });

    const [reservation] = await prisma.$transaction([
      prisma.reservation.create({
        data: {
          reservationNumber,
          trackingCode,
          studentId: student.id,
          sessionId: session.id,
          status: 'PENDING',
          parentName: actualParentName,
          studentPhone: studentPhone ? sanitizePhone(studentPhone) : null,
          qrToken,
          expiresAt,
        },
      }),
      prisma.session.update({
        where: { id: session.id },
        data: { reservedSeats: { increment: 1 } },
      }),
    ]);

    revalidateTag('reservations', 'max');

    let warningMsg: string | undefined;
    if (nameOnlyWarning) {
      warningMsg = 'A student with the same name already exists. Please verify the parent phone number.';
    } else if (siblingNotice) {
      warningMsg = 'Sibling registered under the same parent phone number.';
    }

    return {
      success: true,
      data: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        trackingCode: reservation.trackingCode,
        qrToken: reservation.qrToken,
        status: reservation.status,
        expiresAt: reservation.expiresAt,
        reservedAt: reservation.reservedAt,
        parentName: reservation.parentName,
        studentName: student.name,
        parentPhone: student.parentPhone,
        grade: student.grade,
        session: {
          subject: session.subject || 'General',
          teacherName: session.teacherName || 'Teacher',
          dayOfWeek: session.dayOfWeek,
          time: session.time,
          room: session.room || 'Room 1',
          price: session.price || 0,
        },
      },
      warning: warningMsg,
    };
  } catch (error: any) {
    logger.error('Failed to create public reservation', { error: error.message });
    return { success: false, error: 'Internal server error while processing reservation.' };
  }
}

export async function updatePublicReservationBeforePayment(input: EditReservationBeforePaymentInput) {
  try {
    const { reservationNumber, trackingCode, parentName, studentPhone, notes } = input;

    const reservation = await prisma.reservation.findFirst({
      where: {
        reservationNumber: reservationNumber.trim(),
        trackingCode: trackingCode.trim().toUpperCase(),
      },
      include: { student: true },
    });

    if (!reservation) {
      return { success: false, error: 'Reservation not found.' };
    }

    if (reservation.status !== 'PENDING') {
      return { success: false, error: 'Only pending reservations can be edited before payment.' };
    }

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        parentName: parentName ? parentName.trim() : reservation.parentName,
        studentPhone: studentPhone ? sanitizePhone(studentPhone) : reservation.studentPhone,
      },
    });

    if (notes) {
      await prisma.student.update({
        where: { id: reservation.studentId },
        data: { notes: notes.trim() },
      });
    }

    revalidateTag('reservations', 'max');

    return { success: true, message: 'Reservation updated successfully.' };
  } catch (error: any) {
    logger.error('Failed to edit reservation before payment', { error: error.message });
    return { success: false, error: 'Failed to update reservation.' };
  }
}

export async function lookupPublicReservation(reservationNumber: string, trackingCode: string) {
  try {
    if (!reservationNumber?.trim() || !trackingCode?.trim()) {
      return { success: false, error: 'Reservation number and tracking code are required.' };
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        reservationNumber: reservationNumber.trim(),
        trackingCode: trackingCode.trim().toUpperCase(),
      },
      include: {
        student: true,
        session: true,
      },
    });

    if (!reservation) {
      return { success: false, error: 'No reservation found matching these details.' };
    }

    return {
      success: true,
      data: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        trackingCode: reservation.trackingCode,
        status: reservation.status,
        reservedAt: reservation.reservedAt,
        expiresAt: reservation.expiresAt,
        confirmedAt: reservation.confirmedAt,
        qrToken: reservation.qrToken,
        parentName: reservation.parentName,
        studentName: reservation.student.name,
        parentPhone: reservation.student.parentPhone,
        studentPhone: reservation.studentPhone || reservation.student.studentPhone,
        grade: reservation.student.grade,
        history: (reservation as any).history || [],
        session: {
          id: reservation.session.id,
          subject: reservation.session.subject || 'General',
          teacherName: reservation.session.teacherName || 'Teacher',
          dayOfWeek: reservation.session.dayOfWeek,
          time: reservation.session.time,
          room: reservation.session.room || 'Room 1',
          price: reservation.session.price || 0,
        },
      },
    };
  } catch (error: any) {
    logger.error('Failed public reservation lookup', { error: error.message });
    return { success: false, error: 'Failed to lookup reservation.' };
  }
}
