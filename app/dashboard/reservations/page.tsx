import { getSession } from '@/lib/auth';
import { getAdminReservations as getAdminReservationsAction } from '@/actions/reservations/reservations';
import { redirect } from 'next/navigation';
import { AdminReservationsTable } from '@/components/reservations/AdminReservationsTable';
import { AdminSessionsManagement } from '@/components/reservations/AdminSessionsManagement';
import { ReservationAnalyticsCharts } from '@/components/reservations/ReservationAnalyticsCharts';
import { ReservationCalendarView } from '@/components/reservations/ReservationCalendarView';
import { getLocale } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Calendar, BarChart3, CalendarDays } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Reservations Management',
};

export default async function AdminReservationsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const locale = await getLocale();
  const isAr = locale === 'ar';

  const [{ data, total }, sessionsList] = await Promise.all([
    getAdminReservationsAction(undefined, undefined, undefined, undefined, undefined, 0, 100),
    prisma.session.findMany({
      where: { isArchived: false },
      orderBy: [{ grade: 'asc' }, { dayOfWeek: 'asc' }, { time: 'asc' }],
    }),
  ]);

  const formattedData = data.map((r) => ({
    id: r.id,
    reservationNumber: r.reservationNumber,
    trackingCode: r.trackingCode || null,
    status: r.status,
    reservedAt: r.reservedAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
    confirmedBy: r.confirmedBy,
    qrToken: r.qrToken,
    parentName: r.parentName || null,
    student: {
      id: r.student.id,
      studentId: r.student.studentId,
      name: r.student.name,
      grade: r.student.grade,
      studentPhone: r.student.studentPhone,
      parentPhone: r.student.parentPhone,
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

  const formattedSessions = sessionsList.map((s) => ({
    id: s.id,
    subject: s.subject || 'General',
    teacherName: s.teacherName || 'Teacher',
    grade: s.grade,
    dayOfWeek: s.dayOfWeek,
    time: s.time,
    capacity: s.capacity,
    reservedSeats: s.reservedSeats,
    confirmedSeats: s.confirmedSeats,
    price: s.price,
    room: s.room || 'Room 1',
    description: s.description,
    status: s.status || 'OPEN',
    isArchived: s.isArchived,
  }));

  return (
    <div className="space-y-6" data-testid="admin-reservations-dashboard">
      <Tabs defaultValue="table" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="table" className="flex items-center gap-1.5 text-xs" data-testid="tab-reservations-table">
            <Ticket className="h-3.5 w-3.5" />
            <span>{isAr ? 'الحجوزات والقارئ' : 'Reservations & QR'}</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-1.5 text-xs" data-testid="tab-sessions-management">
            <Calendar className="h-3.5 w-3.5" />
            <span>{isAr ? 'إدارة الحصص' : 'Sessions CRUD'}</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs" data-testid="tab-calendar-view">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{isAr ? 'جدول الحصص' : 'Calendar'}</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs" data-testid="tab-reservation-analytics">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{isAr ? 'التحليلات' : 'Analytics'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <AdminReservationsTable
            initialData={formattedData}
            totalCount={total}
            userRole={session.role as string}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <AdminSessionsManagement initialSessions={formattedSessions} />
        </TabsContent>

        <TabsContent value="calendar">
          <ReservationCalendarView events={formattedSessions} />
        </TabsContent>

        <TabsContent value="analytics">
          <ReservationAnalyticsCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
