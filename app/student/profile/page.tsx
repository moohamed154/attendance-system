import { getDictionary, getLocale } from '@/lib/i18n';
import { getStudentSession } from '@/lib/student-auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ChevronLeft, User, Phone, GraduationCap, Calendar, Hash } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'My Profile',
};

export default async function StudentProfilePage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  const dict = await getDictionary();
  const locale = await getLocale();
  const t = (dict as any).studentAuth?.profile || {};
  const isRtl = locale === 'ar';

  const student = await prisma.student.findUnique({
    where: { id: session.studentDbId },
    include: { session: true },
  });

  if (!student) redirect('/student/login');

  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const days = isRtl ? DAYS_AR : DAYS_EN;

  const fields = [
    { icon: User, label: t.name || 'Name', value: student.name },
    { icon: Hash, label: t.studentId || 'Student ID', value: student.studentId },
    { icon: Phone, label: t.phone || 'Phone', value: student.studentPhone || '—' },
    { icon: GraduationCap, label: t.grade || 'Grade', value: student.grade || '—' },
    {
      icon: Calendar,
      label: t.session || 'Session',
      value: student.session
        ? `${days[student.session.dayOfWeek]} • ${student.session.time}`
        : '—',
    },
  ];

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
          <h1 className="text-xl font-bold tracking-tight">{t.title || 'My Profile'}</h1>
        </div>

        {/* Avatar & Name */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/50">
            {fields.map(({ icon: Icon, label, value }) => (
              <div key={label} className={cn("flex items-center gap-4 p-4", isRtl && "flex-row-reverse")}>
                <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
