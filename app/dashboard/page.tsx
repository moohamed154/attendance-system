import { getSession as getAuthSession } from '@/lib/auth';
import { getTodaySessions } from '@/actions/attendance/attendance';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, Clock, CalendarDays, DollarSign, 
  UserPlus, FileSpreadsheet, ClipboardCheck, CreditCard, BarChart3, Database, History, Activity, AlertTriangle, Ticket, CheckCircle2, Bookmark
} from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { getDictionary, getLocale } from '@/lib/i18n';
import { getSettings } from '@/actions/settings/settings';
import { formatTime } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RuntimeHealthWidget } from '@/components/dashboard/RuntimeHealthWidget';

export default async function DashboardPage() {
  const session = await getAuthSession();
  const isAdmin = session?.role === 'ADMIN';
  const dict = await getDictionary();
  const settings = await getSettings();

  const todayNum = dayjs().day();
  const todaySessions = await getTodaySessions(todayNum);

  const todayStr = dayjs().startOf('day').toDate();
  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  let financialStats: any = null;
  let reservationStats: any = null;
  let outstandingSubscriptions: any[] = [];
  const alerts: any[] = [];

  if (isAdmin) {
    // Financial stats for Current Month
    const monthlyPayments = await prisma.payment.aggregate({
      where: { month: currentMonth, year: currentYear },
      _sum: { amount: true, amountPaid: true },
    });

    const expectedRevenue = monthlyPayments._sum.amount || 0;
    const collectedRevenue = monthlyPayments._sum.amountPaid || 0;
    const remainingRevenue = expectedRevenue - collectedRevenue;
    const collectionPercentage = expectedRevenue > 0 ? Math.round((collectedRevenue / expectedRevenue) * 100) : 0;

    // Today's Payments
    const todaysTransactions = await prisma.paymentTransaction.aggregate({
      where: { date: { gte: todayStr } },
      _sum: { amount: true },
    });

    const todaysRevenue = todaysTransactions._sum.amount || 0;

    // Student Payment Status counts
    const studentsPaidTotal = await prisma.payment.count({ where: { month: currentMonth, year: currentYear, status: 'PAID' } });
    const studentsUnpaidTotal = await prisma.payment.count({ where: { month: currentMonth, year: currentYear, status: 'UNPAID' } });
    const studentsPartialTotal = await prisma.payment.count({ where: { month: currentMonth, year: currentYear, status: 'PARTIAL' } });

    financialStats = {
      expectedRevenue, collectedRevenue, remainingRevenue, collectionPercentage,
      todaysRevenue, studentsPaidTotal, studentsUnpaidTotal, studentsPartialTotal
    };

    // Reservation Stats
    const pendingReservationsCount = await prisma.reservation.count({ where: { status: 'PENDING' } });
    const todayReservationsCount = await prisma.reservation.count({ where: { reservedAt: { gte: todayStr } } });
    const confirmedTodayCount = await prisma.reservation.count({ where: { status: 'CONFIRMED', confirmedAt: { gte: todayStr } } });
    const expiredTodayCount = await prisma.reservation.count({ where: { status: 'EXPIRED', updatedAt: { gte: todayStr } } });
    const waitingListCount = await prisma.waitingList.count({ where: { status: 'WAITING' } });

    reservationStats = {
      pendingReservationsCount,
      todayReservationsCount,
      confirmedTodayCount,
      expiredTodayCount,
      waitingListCount,
    };

    // Outstanding Subscriptions Widget data
    outstandingSubscriptions = await prisma.payment.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        status: { in: ['UNPAID', 'PARTIAL'] },
        student: { isArchived: false }
      },
      include: { student: { include: { session: true } } },
      orderBy: { student: { name: 'asc' } },
      take: 10 // Limit for widget
    });

    // Smart Payment Alerts
    if (studentsUnpaidTotal > 0) {
      alerts.push({ type: 'destructive', title: dict.dashboard.unpaidSubscriptions, desc: `${studentsUnpaidTotal} ${dict.dashboard.studentsNotPaid} ${(dict.paymentsPage.months as any)[currentMonth.toString()]}` });
    }
    if (studentsPartialTotal > 0) {
      alerts.push({ type: 'warning', title: dict.dashboard.partialPayments, desc: `${studentsPartialTotal} ${dict.dashboard.partialPaymentsDesc} ${(dict.paymentsPage.months as any)[currentMonth.toString()]}` });
    }
    
    // Overdue alerts
    const sevenDaysAgo = dayjs().subtract(7, 'days').toDate();
    const overdue7 = await prisma.payment.count({
      where: { status: 'UNPAID', createdAt: { lte: sevenDaysAgo }, month: currentMonth, year: currentYear }
    });
    if (overdue7 > 0) {
      alerts.push({ type: 'destructive', title: dict.dashboard.overduePayments, desc: `${overdue7} ${dict.dashboard.overduePaymentsDesc}` });
    }
  }

  const quickActions = [
    { label: 'Reservations', icon: Ticket, href: '/dashboard/reservations', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: dict.dashboard.addStudent, icon: UserPlus, href: '/dashboard/students', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: dict.nav.import, icon: FileSpreadsheet, href: '/dashboard/students?import=true', color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: dict.dashboard.takeAttendance, icon: ClipboardCheck, href: '/dashboard/attendance', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: dict.dashboard.recordPayment, icon: CreditCard, href: '/dashboard/payments', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: dict.nav.reports, icon: BarChart3, href: '/dashboard/reports', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: dict.dashboard.backup, icon: Database, href: '/dashboard/settings', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: dict.nav.history, icon: History, href: '/dashboard/attendance/history', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAdmin ? dict.dashboard.overview : dict.dashboard.todaySessions}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Intl.DateTimeFormat((await getLocale()) === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'full' }).format(new Date())}
        </p>
      </div>

      {isAdmin && alerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map((alert, idx) => (
            <Alert key={idx} variant={alert.type === 'destructive' ? 'destructive' : 'default'} className={alert.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' : ''}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.desc}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="mb-6">
          <RuntimeHealthWidget />
        </div>
      )}

      {isAdmin && (
        <section>
          <h2 className="text-xl font-semibold mb-4">{dict.dashboard.quickActions}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <Link key={idx} href={action.href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer rounded-2xl active:scale-[0.98] border-border/50 h-full flex flex-col justify-center items-center p-4 text-center">
                  <div className={`p-3 rounded-full ${action.bg} ${action.color} mb-3`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isAdmin && financialStats && (
        <section>
          <h2 className="text-xl font-semibold mb-4">{dict.dashboard.financialOverview} ({(dict.paymentsPage.months as any)[currentMonth.toString()]})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{dict.dashboard.expectedRevenue}</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialStats.expectedRevenue}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{dict.dashboard.collectedRevenue}</CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialStats.collectedRevenue}</div>
                <p className="text-xs text-muted-foreground mt-1">{financialStats.collectionPercentage}{dict.dashboard.percentCollected}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{dict.dashboard.remainingRevenue}</CardTitle>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialStats.remainingRevenue}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-primary">{dict.dashboard.todaysPayments}</CardTitle>
                <DollarSign className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{financialStats.todaysRevenue}</div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {isAdmin && reservationStats && (
        <section data-testid="reservation-widget">
          <h2 className="text-xl font-semibold mb-4">Reservation Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="rounded-2xl border-border/50 bg-amber-500/5 border-amber-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</CardTitle>
                <Clock className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{reservationStats.pendingReservationsCount}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting confirmation</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-blue-500/5 border-blue-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">Today&apos;s Reservations</CardTitle>
                <Ticket className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reservationStats.todayReservationsCount}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Created today</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-green-500/5 border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-green-600 dark:text-green-400">Confirmed Today</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{reservationStats.confirmedTodayCount}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Paid & confirmed</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-red-500/5 border-red-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-red-600 dark:text-red-400">Expired Today</CardTitle>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{reservationStats.expiredTodayCount}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Seats released</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-purple-500/5 border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-purple-600 dark:text-purple-400">Waiting List</CardTitle>
                <Bookmark className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{reservationStats.waitingListCount}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Waiting for opening</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold mb-4">{dict.dashboard.selectSession}</h2>
          {todaySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-2xl border-dashed bg-muted/10 h-48">
              <CalendarDays className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-lg font-medium">{dict.dashboard.noSessions}</h3>
              <p className="text-muted-foreground text-sm">{dict.dashboard.enjoyDayOff}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {todaySessions.map((session) => (
                <Link key={session.id} href={`/dashboard/attendance/select/${session.id}`}>
                  <Card className="rounded-2xl hover:bg-accent/50 transition-colors cursor-pointer border-border/50 active:scale-[0.98] duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {session.grade === '1' ? dict.grades.grade1 : 
                             session.grade === '2' ? dict.grades.grade2 : 
                             session.grade === '3' ? dict.grades.grade3 : session.grade}
                          </CardTitle>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center text-muted-foreground text-sm">
                              <Clock className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                              <span>{formatTime(session.time, settings.timeFormat)}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground text-xs">
                              <CalendarDays className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />
                              <span>{session.dayOfWeek === 0 ? dict.sessionsPage.days.sunTueThu : dict.sessionsPage.days.satMonWed}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="rounded-full px-3">
                          {session._count.students} {dict.dashboard.studentsCount}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {isAdmin && outstandingSubscriptions.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{dict.dashboard.unpaidSubscriptions}</h2>
              <Link href="/dashboard/payments">
                <span className="text-sm text-primary hover:underline cursor-pointer">{dict.dashboard.viewAll}</span>
              </Link>
            </div>
            <Card className="rounded-2xl border-border/50">
              <div className="divide-y">
                {outstandingSubscriptions.map((payment) => (
                  <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <Link href={`/dashboard/students/${payment.studentId}`} className="font-medium hover:underline block">
                        {payment.student.name}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1 flex gap-2 items-center">
                        <Badge variant="outline">{payment.student.session?.grade || payment.student.grade}</Badge>
                        <span>{payment.student.studentId}</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold text-destructive">
                        {payment.amount - (payment.amountPaid || 0)} <span className="text-xs font-normal">{dict.dashboard.remaining}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {dict.dashboard.due} {payment.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
