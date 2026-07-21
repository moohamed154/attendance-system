import { getDictionary, getLocale } from '@/lib/i18n';
import { getStudentSession } from '@/lib/student-auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { StudentDashboard } from '@/components/student/StudentDashboard';

export const metadata = {
  title: 'Student Dashboard',
};

export default async function StudentHomePage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  const dict = await getDictionary();
  const locale = await getLocale();

  const student = await prisma.student.findUnique({
    where: { id: session.studentDbId },
    include: {
      session: true,
      attendances: {
        orderBy: { date: 'desc' },
      },
      payments: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 1,
      },
    },
  });

  if (!student) redirect('/student/login');

  // Compute attendance summary
  const attendanceSummary = {
    total: student.attendances.length,
    present: student.attendances.filter(a => a.status === 'PRESENT').length,
    absent: student.attendances.filter(a => a.status === 'ABSENT').length,
    late: student.attendances.filter(a => a.status === 'LATE').length,
  };

  const latestPayment = student.payments[0]
    ? {
        month: student.payments[0].month,
        year: student.payments[0].year,
        amount: student.payments[0].amount,
        amountPaid: student.payments[0].amountPaid || 0,
        status: student.payments[0].status,
      }
    : null;

  return (
    <div className="min-h-screen bg-background" data-testid="portal-dashboard">
      <div className="max-w-lg mx-auto px-4 py-6">
        <StudentDashboard
          student={{
            id: student.id,
            studentId: student.studentId,
            name: student.name,
            grade: student.grade,
            studentPhone: student.studentPhone,
            session: student.session
              ? {
                  time: student.session.time,
                  grade: student.session.grade,
                  dayOfWeek: student.session.dayOfWeek,
                }
              : null,
          }}
          attendanceSummary={attendanceSummary}
          latestPayment={latestPayment}
          dict={dict}
          locale={locale}
        />
      </div>
    </div>
  );
}
