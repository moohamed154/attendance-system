'use client';

import { studentLogoutAction } from '@/actions/student-auth';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  ClipboardList,
  CreditCard,
  User,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
}

interface PaymentSummary {
  month: number;
  year: number;
  amount: number;
  amountPaid: number;
  status: string;
}

interface StudentDashboardProps {
  student: {
    id: string;
    studentId: string;
    name: string;
    grade?: string | null;
    studentPhone?: string | null;
    session?: { time: string; grade: string; dayOfWeek: number } | null;
  };
  attendanceSummary: AttendanceSummary;
  latestPayment: PaymentSummary | null;
  dict: any;
  locale: string;
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function StudentDashboard({ student, attendanceSummary, latestPayment, dict, locale }: StudentDashboardProps) {
  const t = dict.studentAuth?.dashboard || {};
  const isRtl = locale === 'ar';
  const days = isRtl ? DAYS_AR : DAYS_EN;

  const attendanceRate = attendanceSummary.total > 0
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
    : 0;

  const paymentStatusColor = {
    PAID: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    UNPAID: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    PARTIAL: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  };

  const monthNames = isRtl
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className={cn("space-y-6 pb-8", isRtl && "text-right")} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t.welcome || 'Welcome back'}</p>
            <h1 className="text-xl font-bold tracking-tight leading-tight">{student.name}</h1>
          </div>
        </div>
        <form action={studentLogoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-destructive"
            title={t.logout || 'Logout'}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Attendance Overview */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t.attendanceStats || 'Attendance Overview'}</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Rate */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t.attendanceRate || 'Attendance Rate'}</span>
            <span className={cn(
              "text-2xl font-bold",
              attendanceRate >= 80 ? "text-green-600 dark:text-green-400" :
              attendanceRate >= 60 ? "text-amber-600 dark:text-amber-400" :
              "text-red-600 dark:text-red-400"
            )}>
              {attendanceRate}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                attendanceRate >= 80 ? "bg-green-500" :
                attendanceRate >= 60 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: t.totalSessions || 'Total', value: attendanceSummary.total, icon: Calendar, color: 'text-foreground' },
              { label: t.present || 'Present', value: attendanceSummary.present, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
              { label: t.absent || 'Absent', value: attendanceSummary.absent, icon: XCircle, color: 'text-red-600 dark:text-red-400' },
              { label: t.late || 'Late', value: attendanceSummary.late, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-muted/40 rounded-xl p-3 space-y-1">
                <Icon className={cn("w-4 h-4 mx-auto", color)} />
                <p className={cn("text-lg font-bold", color)}>{value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Card */}
      {latestPayment && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">{t.subscription || 'Subscription'}</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {monthNames[latestPayment.month - 1]} {latestPayment.year}
              </span>
              <span className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full border",
                paymentStatusColor[latestPayment.status as keyof typeof paymentStatusColor] || paymentStatusColor.UNPAID
              )}>
                {latestPayment.status === 'PAID' ? (t.paid || 'Paid') :
                 latestPayment.status === 'PARTIAL' ? (t.partial || 'Partial') :
                 (t.unpaid || 'Unpaid')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.balance || 'Balance'}</span>
              <span className="font-semibold">
                {latestPayment.amountPaid || 0} / {latestPayment.amount} {dict.general?.currency || 'EGP'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">{t.quickActions || 'Quick Actions'}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/student/card', label: t.myQRCard || 'My QR Card', icon: QrCode, color: 'from-primary/15 to-primary/5 border-primary/20 text-primary' },
            { href: '/student/attendance', label: t.attendanceHistory || 'Attendance', icon: ClipboardList, color: 'from-blue-500/15 to-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400' },
            { href: '/student/payments', label: t.payments || 'Payments', icon: CreditCard, color: 'from-green-500/15 to-green-500/5 border-green-500/20 text-green-600 dark:text-green-400' },
            { href: '/student/profile', label: t.profile || 'Profile', icon: User, color: 'from-purple-500/15 to-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "bg-gradient-to-br border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]",
                color
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-semibold leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Session info */}
      {student.session && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t.noSession || 'Session'}</p>
            <p className="text-sm font-medium truncate">
              {days[student.session.dayOfWeek]} • {student.session.time}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
