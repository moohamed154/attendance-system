import { getDictionary, getLocale } from '@/lib/i18n';
import { getStudentSession } from '@/lib/student-auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Ticket, GraduationCap } from 'lucide-react';
import { StudentReservationCatalog } from '@/components/reservations/StudentReservationCatalog';
import { MyReservationsList } from '@/components/reservations/MyReservationsList';
import { SavedReservationsLocalSync } from '@/components/reservations/SavedReservationsLocalSync';
import { getSettings } from '@/actions/settings/settings';

export const metadata = {
  title: 'Reservations Portal',
};

export default async function StudentReservationsPage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  const dict = await getDictionary();
  const locale = await getLocale();
  const isRtl = locale === 'ar';
  const settings = await getSettings();

  const student = await prisma.student.findUnique({
    where: { id: session.studentDbId },
    select: {
      id: true,
      studentId: true,
      name: true,
      grade: true,
    },
  });

  if (!student) redirect('/student/login');

  // Fetch available sessions (matching student grade or all active sessions)
  const availableSessions = await prisma.session.findMany({
    where: {
      isArchived: false,
      ...(student.grade ? { grade: student.grade } : {}),
    },
    orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
  });

  // If no grade match or few sessions, get all unarchived sessions
  const sessions = availableSessions.length > 0
    ? availableSessions
    : await prisma.session.findMany({
        where: { isArchived: false },
        orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
      });

  // Fetch student reservations
  const rawReservations = await prisma.reservation.findMany({
    where: { studentId: student.id },
    include: { session: true },
    orderBy: { createdAt: 'desc' },
  });

  const activePendingCount = rawReservations.filter((r) => r.status === 'PENDING').length;
  const maxPendingLimit = parseInt(settings.max_pending_reservations || '2', 10);

  const formattedReservations = rawReservations.map((r) => ({
    id: r.id,
    reservationNumber: r.reservationNumber,
    status: r.status,
    reservedAt: r.reservedAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    qrToken: r.qrToken,
    session: {
      subject: r.session.subject,
      teacherName: r.session.teacherName,
      grade: r.session.grade,
      dayOfWeek: r.session.dayOfWeek,
      time: r.session.time,
      price: r.session.price,
      room: r.session.room,
    },
  }));

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background pb-12" data-testid="portal-reservations">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/student">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <BackIcon className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Student Portal</p>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Session Reservations
              </h1>
            </div>
          </div>
        </div>

        {/* Saved Reservations Local Storage Sync Component */}
        <SavedReservationsLocalSync serverReservations={formattedReservations} />

        {/* My Reservations List */}
        <MyReservationsList
          reservations={formattedReservations}
          studentName={student.name}
          locale={locale}
        />

        {/* Available Sessions Catalog */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Reserve Available Sessions
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              Grade: {student.grade || 'All'}
            </span>
          </div>

          <StudentReservationCatalog
            sessions={sessions.map((s) => ({
              id: s.id,
              dayOfWeek: s.dayOfWeek,
              time: s.time,
              grade: s.grade,
              subject: s.subject,
              teacherName: s.teacherName,
              capacity: s.capacity,
              reservedSeats: s.reservedSeats,
              confirmedSeats: s.confirmedSeats,
              price: s.price,
              duration: s.duration,
              room: s.room,
            }))}
            activePendingCount={activePendingCount}
            maxPendingLimit={maxPendingLimit}
            dict={dict}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
