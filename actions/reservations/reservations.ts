'use server';

import { prisma } from '@/lib/prisma';
import { getStudentSession } from '@/lib/student-auth';
import { getSession } from '@/lib/auth';
import { logActivity } from '../settings/activity';
import { getSettings } from '../settings/settings';
import { generateReservationQRToken, verifyReservationQRToken } from '@/lib/qr/reservation-token';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';

export type ReservationResult<T = any> =
  | {
      success: true;
      data?: T;
      message?: string;
      warning?: string;
      reservationNumber?: string;
    }
  | {
      error: string;
      duplicateCase?: 'CASE_1' | 'CASE_2' | 'CASE_3';
      duplicateInfo?: {
        studentName: string;
        parentPhone?: string;
        grade?: string;
        studentId?: string;
        existingReservations?: any[];
      };
      scanResult?: string;
    };

// Human-friendly Reservation Number format: RES-YYYYMMDD-XXXXXX
async function generateHumanReservationNumber(prefix: string = 'RES'): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await prisma.reservation.count({
    where: {
      reservationNumber: { contains: `-${dateStr}-` },
    },
  });
  const seq = (countToday + 1).toString().padStart(6, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

// ─── Seat Lock Operations ───
export async function acquireSeatLock(sessionId: string): Promise<ReservationResult> {
  try {
    const studentSession = await getStudentSession();
    if (!studentSession) return { error: 'Unauthorized' };

    const lockDurationMs = 30 * 1000; // 30 seconds
    const now = new Date();
    const expiresAt = new Date(now.getTime() + lockDurationMs);

    // Clean expired locks for this session first
    await prisma.seatLock.deleteMany({
      where: { sessionId, expiresAt: { lte: now } },
    });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.isArchived) return { error: 'Session unavailable' };

    const activeLocks = await prisma.seatLock.count({
      where: { sessionId, expiresAt: { gt: now } },
    });

    const cap = session.capacity ?? 30;
    const res = session.reservedSeats ?? 0;
    const conf = session.confirmedSeats ?? 0;
    const available = cap - (res + conf + activeLocks);

    if (available <= 0) {
      return { error: 'Session Full' };
    }

    const seatLock = await prisma.seatLock.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: studentSession.studentDbId,
        },
      },
      update: { lockedAt: now, expiresAt },
      create: {
        sessionId,
        studentId: studentSession.studentDbId,
        lockedAt: now,
        expiresAt,
      },
    });

    return { success: true, data: seatLock };
  } catch (err: any) {
    return { error: err?.message || 'Failed to lock seat' };
  }
}

export async function releaseSeatLock(sessionId: string) {
  try {
    const studentSession = await getStudentSession();
    if (!studentSession) return;

    await prisma.seatLock.deleteMany({
      where: {
        sessionId,
        studentId: studentSession.studentDbId,
      },
    });
  } catch {
    // Ignore cleanup error
  }
}

// ─── 1. Student Creates Reservation with Duplicate Validation ───
export async function createReservation(sessionId: string): Promise<ReservationResult> {
  try {
    const studentSession = await getStudentSession();
    if (!studentSession) {
      return { error: 'Unauthorized. Please login to your student account.' };
    }

    const settings = await getSettings();
    const isEnabled = settings.reservation_enabled !== 'false';
    if (!isEnabled) {
      return { error: 'Reservations are currently disabled.' };
    }

    const maxPending = parseInt(settings.max_pending_reservations || '2', 10);
    const expirationHours = parseInt(settings.reservation_expiration_hours || '48', 10);
    const prefix = settings.reservation_prefix || 'RES';

    // Fetch current student details
    const student = await prisma.student.findUnique({
      where: { id: studentSession.studentDbId },
      include: { reservations: true },
    });

    if (!student) return { error: 'Student record not found.' };

    const studentPhoneStr = student.studentPhone || '';
    const parentPhoneStr = student.parentPhone || studentPhoneStr;
    const studentNameStr = student.name;

    // ─── ADVANCED DUPLICATE STUDENT VALIDATION (Server Action Only) ───
    // Check Case 1: Same Parent Phone + Same Name
    const exactDuplicate = await prisma.student.findFirst({
      where: {
        id: { not: student.id },
        name: { equals: studentNameStr, mode: 'insensitive' },
        OR: [
          { parentPhone: parentPhoneStr },
          { studentPhone: parentPhoneStr },
          { parentPhone: studentPhoneStr },
        ],
      },
      include: { reservations: true },
    });

    if (exactDuplicate) {
      return {
        error: 'This student already exists with the same parent phone number.',
        duplicateCase: 'CASE_1',
        duplicateInfo: {
          studentName: exactDuplicate.name,
          parentPhone: exactDuplicate.parentPhone || exactDuplicate.studentPhone,
          grade: exactDuplicate.grade || undefined,
          studentId: exactDuplicate.studentId,
          existingReservations: exactDuplicate.reservations,
        },
      };
    }

    // Check Case 2: Same Parent Phone, Different Name (Sibling)
    let siblingNotice: string | undefined;
    const siblingStudent = await prisma.student.findFirst({
      where: {
        id: { not: student.id },
        name: { not: studentNameStr },
        OR: [
          { parentPhone: parentPhoneStr },
          { studentPhone: parentPhoneStr },
        ],
      },
    });

    if (siblingStudent) {
      siblingNotice = 'Another student is already registered under this parent.';
    }

    // Check Case 3: Same Name, Different Parent Phone
    let sameNameWarning: string | undefined;
    const sameNameStudent = await prisma.student.findFirst({
      where: {
        id: { not: student.id },
        name: { equals: studentNameStr, mode: 'insensitive' },
        parentPhone: { not: parentPhoneStr },
        studentPhone: { not: parentPhoneStr },
      },
    });

    if (sameNameStudent) {
      sameNameWarning = 'A student with the same name already exists. Please verify the parent phone number.';
    }

    // Check Student's Active Pending Reservations Count
    const activePendingCount = await prisma.reservation.count({
      where: {
        studentId: studentSession.studentDbId,
        status: 'PENDING',
      },
    });

    if (activePendingCount >= maxPending) {
      return { error: 'You already have two pending reservations.' };
    }

    // Fetch target Session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.isArchived) {
      return { error: 'Session not found or unavailable.' };
    }

    const capacity = session.capacity ?? 30;
    const reservedSeats = session.reservedSeats ?? 0;
    const confirmedSeats = session.confirmedSeats ?? 0;
    const availableSeats = capacity - (reservedSeats + confirmedSeats);

    if (availableSeats <= 0) {
      return { error: 'Session Full' };
    }

    // Create Reservation in Prisma Transaction
    const reservationNumber = await generateHumanReservationNumber(prefix);
    const reservedAt = new Date();
    const expiresAt = new Date(reservedAt.getTime() + expirationHours * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // Re-verify capacity lock
      const freshSession = await tx.session.findUnique({ where: { id: sessionId } });
      if (!freshSession) throw new Error('Session not found');

      const fCapacity = freshSession.capacity ?? 30;
      const fReserved = freshSession.reservedSeats ?? 0;
      const fConfirmed = freshSession.confirmedSeats ?? 0;

      if (fCapacity - (fReserved + fConfirmed) <= 0) {
        throw new Error('Session Full');
      }

      // Increment reservedSeats
      await tx.session.update({
        where: { id: sessionId },
        data: { reservedSeats: { increment: 1 } },
      });

      // Release seat lock if present
      await tx.seatLock.deleteMany({
        where: { sessionId, studentId: studentSession.studentDbId },
      });

      // Create Reservation
      const reservation = await tx.reservation.create({
        data: {
          reservationNumber,
          studentId: studentSession.studentDbId,
          sessionId,
          status: 'PENDING',
          reservedAt,
          expiresAt,
        },
      });

      // Generate Signed QR Token
      const qrToken = generateReservationQRToken({
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        studentId: studentSession.studentDbId,
        sessionId,
        status: 'PENDING',
        timestamp: Date.now(),
      });

      const updatedReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: { qrToken },
      });

      // Status Timeline Entry
      await tx.reservationStatusHistory.create({
        data: {
          reservationId: reservation.id,
          oldStatus: null,
          newStatus: 'PENDING',
          changedById: studentSession.studentDbId,
          changedByRole: 'STUDENT',
          reason: 'Student created reservation',
        },
      });

      return updatedReservation;
    });

    revalidateTag('reservations', 'max');
    revalidatePath('/student/reservations');

    const paymentMessage =
      'Your reservation has been created successfully. Please visit the center within the configured reservation period to complete your payment. Reservations that are not confirmed before expiration will be cancelled automatically.';

    return {
      success: true,
      data: result,
      reservationNumber,
      message: paymentMessage,
      warning: sameNameWarning || siblingNotice,
    };
  } catch (err: any) {
    if (err?.message === 'Session Full') {
      return { error: 'Session Full' };
    }
    return { error: err?.message || 'Failed to create reservation' };
  }
}

// ─── 2. Cancel Reservation ───
export async function cancelReservation(reservationId: string, reason?: string): Promise<ReservationResult> {
  try {
    const studentSession = await getStudentSession();
    const adminSession = await getSession();

    if (!studentSession && !adminSession) {
      return { error: 'Unauthorized' };
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { session: true },
    });

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    if (studentSession && !adminSession) {
      if (reservation.studentId !== studentSession.studentDbId) {
        return { error: 'Unauthorized action on reservation' };
      }
      if (reservation.status !== 'PENDING') {
        return { error: 'Confirmed reservations cannot be cancelled by students.' };
      }
    }

    if (adminSession && adminSession.role === 'ASSISTANT') {
      return { error: 'Assistants cannot cancel confirmed reservations.' };
    }

    const oldStatus = reservation.status;
    if (oldStatus === 'CANCELLED' || oldStatus === 'EXPIRED') {
      return { error: `Reservation is already ${oldStatus.toLowerCase()}` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: adminSession ? (adminSession.name as string) : (studentSession?.name as string) || 'User',
        },
      });

      if (oldStatus === 'PENDING') {
        await tx.session.update({
          where: { id: reservation.sessionId },
          data: { reservedSeats: { decrement: 1 } },
        });
      } else if (oldStatus === 'CONFIRMED') {
        await tx.session.update({
          where: { id: reservation.sessionId },
          data: { confirmedSeats: { decrement: 1 } },
        });
      }

      await tx.reservationStatusHistory.create({
        data: {
          reservationId,
          oldStatus,
          newStatus: 'CANCELLED',
          changedById: adminSession ? (adminSession.id as string) : studentSession?.studentDbId,
          changedByRole: adminSession ? (adminSession.role as string) : 'STUDENT',
          reason: reason || 'Cancelled by user',
        },
      });

      // Auto Promote Top Waiting Student
      const topWaiting = await tx.waitingList.findFirst({
        where: { sessionId: reservation.sessionId, status: 'WAITING' },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      });

      if (topWaiting) {
        const settings = await getSettings();
        const expirationHours = parseInt(settings.reservation_expiration_hours || '48', 10);
        const prefix = settings.reservation_prefix || 'RES';
        const resNum = await generateHumanReservationNumber(prefix);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

        await tx.waitingList.update({
          where: { id: topWaiting.id },
          data: { status: 'PROMOTED' },
        });

        const promotedRes = await tx.reservation.create({
          data: {
            reservationNumber: resNum,
            studentId: topWaiting.studentId,
            sessionId: reservation.sessionId,
            status: 'PENDING',
            reservedAt: now,
            expiresAt,
          },
        });

        const qrToken = generateReservationQRToken({
          reservationId: promotedRes.id,
          reservationNumber: promotedRes.reservationNumber,
          studentId: topWaiting.studentId,
          sessionId: reservation.sessionId,
          status: 'PENDING',
          timestamp: Date.now(),
        });

        await tx.reservation.update({
          where: { id: promotedRes.id },
          data: { qrToken },
        });

        await tx.session.update({
          where: { id: reservation.sessionId },
          data: { reservedSeats: { increment: 1 } },
        });
      }
    });

    if (adminSession) {
      await logActivity('Reservation Cancelled', reservation.reservationNumber, reason);
    }

    revalidateTag('reservations', 'max');
    revalidatePath('/dashboard/reservations');
    revalidatePath('/student/reservations');

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to cancel reservation' };
  }
}

// ─── 3. Admin Confirms Payment ───
export async function confirmPayment(reservationId: string, notes?: string): Promise<ReservationResult> {
  try {
    const adminSession = await getSession();
    if (!adminSession) {
      return { error: 'Unauthorized' };
    }
    if (adminSession.role !== 'ADMIN') {
      return { error: 'Only Admin can confirm payment.' };
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { session: true },
    });

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    if (reservation.status !== 'PENDING') {
      return { error: `Cannot confirm reservation in '${reservation.status}' status.` };
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();

      const confirmedQRToken = generateReservationQRToken({
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        studentId: reservation.studentId,
        sessionId: reservation.sessionId,
        status: 'CONFIRMED',
        timestamp: Date.now(),
      });

      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: now,
          confirmedBy: adminSession.name || 'Admin',
          notes: notes || reservation.notes,
          qrToken: confirmedQRToken,
        },
      });

      await tx.session.update({
        where: { id: reservation.sessionId },
        data: {
          reservedSeats: { decrement: 1 },
          confirmedSeats: { increment: 1 },
        },
      });

      await tx.reservationStatusHistory.create({
        data: {
          reservationId,
          oldStatus: 'PENDING',
          newStatus: 'CONFIRMED',
          changedById: adminSession.id as string,
          changedByRole: adminSession.role as string,
          reason: notes || 'Admin confirmed payment',
        },
      });
    });

    await logActivity('Reservation Confirmed', reservation.reservationNumber, notes || 'Payment confirmed by Admin');

    revalidateTag('reservations', 'max');
    revalidatePath('/dashboard/reservations');
    revalidatePath('/student/reservations');

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to confirm payment' };
  }
}

// ─── 4. Fetch Student Reservations ───
export async function getStudentReservations() {
  const studentSession = await getStudentSession();
  if (!studentSession) return { reservations: [], waitingList: [] };

  const [reservations, waitingList] = await Promise.all([
    prisma.reservation.findMany({
      where: { studentId: studentSession.studentDbId },
      include: {
        session: true,
        history: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.waitingList.findMany({
      where: { studentId: studentSession.studentDbId },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { reservations, waitingList };
}

// ─── 5. Fetch Admin Reservations ───
export async function getAdminReservations(
  query?: string,
  statusFilter?: string,
  teacherFilter?: string,
  subjectFilter?: string,
  gradeFilter?: string,
  skip: number = 0,
  take: number = 20
) {
  const session = await getSession();
  if (!session) return { data: [], total: 0 };

  const where: Prisma.ReservationWhereInput = {};

  if (statusFilter && statusFilter !== 'all') {
    where.status = statusFilter as any;
  }

  if (gradeFilter && gradeFilter !== 'all') {
    where.session = { ...(where.session as any), grade: gradeFilter };
  }

  if (subjectFilter && subjectFilter !== 'all') {
    where.session = { ...(where.session as any), subject: subjectFilter };
  }

  if (teacherFilter && teacherFilter !== 'all') {
    where.session = { ...(where.session as any), teacherName: teacherFilter };
  }

  if (query) {
    where.OR = [
      { reservationNumber: { contains: query } },
      { student: { name: { contains: query } } },
      { student: { studentId: { contains: query } } },
      { student: { studentPhone: { contains: query } } },
      { student: { parentPhone: { contains: query } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            grade: true,
            studentPhone: true,
            parentPhone: true,
          },
        },
        session: true,
        history: { orderBy: { createdAt: 'desc' } },
        scans: { orderBy: { scanTime: 'desc' }, take: 5 },
      },
    }),
    prisma.reservation.count({ where }),
  ]);

  return { data, total };
}

// ─── 6. Join & Leave Waiting List ───
export async function joinWaitingList(sessionId: string): Promise<ReservationResult> {
  try {
    const studentSession = await getStudentSession();
    if (!studentSession) {
      return { error: 'Unauthorized. Please login.' };
    }

    const settings = await getSettings();
    if (settings.waiting_list_enabled === 'false') {
      return { error: 'Waiting list feature is disabled.' };
    }

    const existing = await prisma.waitingList.findUnique({
      where: {
        studentId_sessionId: {
          studentId: studentSession.studentDbId,
          sessionId,
        },
      },
    });

    if (existing && existing.status === 'WAITING') {
      return { error: 'You are already on the waiting list for this session.' };
    }

    const maxPriority = await prisma.waitingList.aggregate({
      where: { sessionId },
      _max: { priority: true },
    });

    const nextPriority = (maxPriority._max.priority ?? 0) + 1;

    await prisma.waitingList.upsert({
      where: {
        studentId_sessionId: {
          studentId: studentSession.studentDbId,
          sessionId,
        },
      },
      update: {
        status: 'WAITING',
        priority: nextPriority,
      },
      create: {
        studentId: studentSession.studentDbId,
        sessionId,
        status: 'WAITING',
        priority: nextPriority,
      },
    });

    await logActivity('Waiting List Joined', `Session ID: ${sessionId}`);

    revalidateTag('reservations', 'max');
    revalidatePath('/student/reservations');

    return { success: true, message: 'You have successfully joined the waiting list.' };
  } catch (err: any) {
    return { error: err?.message || 'Failed to join waiting list' };
  }
}

// ─── 7. Enterprise Admin QR Verification & Replay Protection ───
export async function validateAndScanReservationQR(tokenOrNum: string, device?: string, ip?: string) {
  const adminSession = await getSession();
  if (!adminSession) {
    return { error: 'Unauthorized scanner access.', scanResult: 'UNAUTHORIZED' };
  }

  let reservationNumberLookup = tokenOrNum.trim();
  let isValidSignature = true;

  if (tokenOrNum.startsWith('RESQR:')) {
    const tokenPayload = verifyReservationQRToken(tokenOrNum);
    if (!tokenPayload) {
      isValidSignature = false;
    } else {
      reservationNumberLookup = tokenPayload.reservationNumber;
    }
  }

  // 1. Signature check failure
  if (!isValidSignature) {
    return {
      error: 'Invalid Reservation QR.',
      scanResult: 'INVALID_SIGNATURE',
    };
  }

  // 2. Lookup reservation strictly by Reservation Number in database (sole source of truth)
  const reservation = await prisma.reservation.findFirst({
    where: {
      OR: [
        { reservationNumber: reservationNumberLookup },
        { id: reservationNumberLookup },
      ],
    },
    include: {
      student: true,
      session: true,
      history: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!reservation) {
    return { error: 'Reservation Number not found in database.', scanResult: 'NOT_FOUND' };
  }

  let currentStatus = reservation.status;
  let scanResultCode = 'VALID';

  // Expiration check
  if (currentStatus === 'PENDING' && new Date() > new Date(reservation.expiresAt)) {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'EXPIRED' },
      });
      await tx.session.update({
        where: { id: reservation.sessionId },
        data: { reservedSeats: { decrement: 1 } },
      });
      await tx.reservationStatusHistory.create({
        data: {
          reservationId: reservation.id,
          oldStatus: 'PENDING',
          newStatus: 'EXPIRED',
          reason: 'Expired upon QR scan',
        },
      });
    });
    currentStatus = 'EXPIRED';
    scanResultCode = 'EXPIRED';
  } else if (currentStatus === 'CONFIRMED') {
    scanResultCode = 'ALREADY_CONFIRMED';
  } else if (currentStatus === 'CANCELLED') {
    scanResultCode = 'CANCELLED';
  } else if (currentStatus === 'COMPLETED') {
    scanResultCode = 'COMPLETED';
  }

  // Log scan attempt with exact Scan Result
  await prisma.reservationScanLog.create({
    data: {
      reservationId: reservation.id,
      scannerUserId: adminSession.id as string,
      action: `QR_SCAN_${scanResultCode}`,
      scanResult: scanResultCode,
      device: device || 'Admin Scanner Web',
      ip: ip || '127.0.0.1',
    },
  });

  await logActivity('QR Scanned', reservation.reservationNumber, `Scanned by ${adminSession.name} - Result: ${scanResultCode}`);

  let errorMessageToReturn: string | undefined;
  if (scanResultCode === 'ALREADY_CONFIRMED') {
    errorMessageToReturn = 'This reservation has already been confirmed.';
  } else if (scanResultCode === 'EXPIRED') {
    errorMessageToReturn = 'This reservation has expired.';
  } else if (scanResultCode === 'CANCELLED') {
    errorMessageToReturn = 'This reservation has been cancelled.';
  } else if (scanResultCode === 'COMPLETED') {
    errorMessageToReturn = 'This reservation has already been completed.';
  }

  return {
    success: true,
    scanResult: scanResultCode,
    error: errorMessageToReturn,
    reservation: {
      ...reservation,
      status: currentStatus,
    },
  };
}

// ─── 8. Scheduler Auto Expiration ───
export async function expirePendingReservations() {
  try {
    const now = new Date();
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      include: { session: true },
    });

    let count = 0;
    for (const res of expiredReservations) {
      await cancelReservation(res.id, 'System Auto-Expiration');
      count++;
    }

    return { success: true, count };
  } catch (err: any) {
    return { error: err?.message || 'Auto-expiration error' };
  }
}
