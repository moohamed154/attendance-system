import { getSession } from '@/lib/auth';
import { getAdminReservations } from '@/actions/reservations/reservations';
import { redirect } from 'next/navigation';
import { AdminReservationsTable } from '@/components/reservations/AdminReservationsTable';
import { getLocale } from '@/lib/i18n';

export const metadata = {
  title: 'Reservations Management',
};

export default async function AdminReservationsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const locale = await getLocale();
  const { data, total } = await getAdminReservations(undefined, undefined, undefined, undefined, undefined, 0, 100);

  const formattedData = data.map((r) => ({
    id: r.id,
    reservationNumber: r.reservationNumber,
    status: r.status,
    reservedAt: r.reservedAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
    confirmedBy: r.confirmedBy,
    qrToken: r.qrToken,
    student: {
      id: r.student.id,
      studentId: r.student.studentId,
      name: r.student.name,
      grade: r.student.grade,
      studentPhone: r.student.studentPhone,
    },
    session: {
      id: r.session.id,
      subject: r.session.subject,
      teacherName: r.session.teacherName,
      grade: r.session.grade,
      dayOfWeek: r.session.dayOfWeek,
      time: r.session.time,
      price: r.session.price,
      room: r.session.room,
    },
    history: r.history,
  }));

  return (
    <AdminReservationsTable
      initialData={formattedData}
      totalCount={total}
      userRole={session.role as string}
      locale={locale}
    />
  );
}
