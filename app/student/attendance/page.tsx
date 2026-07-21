import { getDictionary, getLocale } from '@/lib/i18n';
import { getStudentSession } from '@/lib/student-auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export const metadata = {
  title: 'My Attendance',
};

export default async function StudentAttendancePage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  const dict = await getDictionary();
  const locale = await getLocale();
  const t = (dict as any).studentAuth?.attendance || {};
  const isRtl = locale === 'ar';

  const student = await prisma.student.findUnique({
    where: { id: session.studentDbId },
    include: {
      attendances: {
        include: { session: true },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!student) redirect('/student/login');

  const statusConfig = {
    PRESENT: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', label: dict.general?.status?.PRESENT || 'Present' },
    ABSENT: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: dict.general?.status?.ABSENT || 'Absent' },
    LATE: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: dict.general?.status?.LATE || 'Late' },
  };

  return (
    <div className={cn("min-h-screen bg-background", isRtl && "text-right")} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted/50 transition-colors shrink-0"
          >
            <ChevronLeft className={cn("w-4 h-4", isRtl && "rotate-180")} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{t.title || 'My Attendance'}</h1>
        </div>

        {/* Records */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {student.attendances.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {t.noRecords || 'No attendance records found'}
            </div>
          ) : (
            <div className="divide-y divide-border/50" data-testid="portal-attendance-list">
              {student.attendances.map((att) => {
                const cfg = statusConfig[att.status] || statusConfig.ABSENT;
                const Icon = cfg.icon;
                return (
                  <div key={att.id} className="flex items-center justify-between p-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {att.session ? `${att.session.grade} • ${att.session.time}` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dayjs(att.date).format('DD MMM YYYY')}
                        </p>
                      </div>
                    </div>
                    <span className={cn("text-xs font-semibold shrink-0", cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
