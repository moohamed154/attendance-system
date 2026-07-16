import { getAttendanceStats, getPaymentStats, getTopInsights } from '@/actions/reports';
import { getSession } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';
import { redirect } from 'next/navigation';
import { AttendanceChart } from '@/components/charts/attendance-chart';
import { PaymentsChart } from '@/components/charts/payments-chart';
import { ExportButton } from '@/components/export-button';
import { getSettings } from '@/actions/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { DatePickerWithRange } from '@/components/date-range-picker';
import dayjs from 'dayjs';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string, to?: string }> }) {
  const authSession = await getSession();
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const resolvedParams = await searchParams;
  const from = resolvedParams.from ? dayjs(resolvedParams.from).toDate() : dayjs().subtract(30, 'days').toDate();
  const to = resolvedParams.to ? dayjs(resolvedParams.to).toDate() : dayjs().toDate();

  const attendanceData = await getAttendanceStats(from, to);
  const paymentData = await getPaymentStats(from, to);
  const insights = await getTopInsights(from, to);
  const dict = await getDictionary();
  const t: any = dict.reportsPage || {};
  const settings = await getSettings();
  const currencySymbol = settings.currency || dict.paymentsPage.currency;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DatePickerWithRange />
          <ExportButton data={attendanceData} paymentData={paymentData} dict={dict} currency={currencySymbol} />
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              {t.mostAbsentTitle || 'Most Absent (Selected Period)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.mostAbsent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noAbsences || 'No absences recorded'}</p>
            ) : (
              <ol className="space-y-1">
                {insights.mostAbsent.map((s, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="truncate">{i + 1}. {s.name}</span>
                    <span className="font-bold text-red-500 rtl:mr-2 ltr:ml-2">{s.absences}×</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {t.bestAttendanceTitle || 'Best Attendance (Selected Period)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.bestAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noData || 'No data yet'}</p>
            ) : (
              <ol className="space-y-1">
                {insights.bestAttendance.map((s, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="truncate">{i + 1}. {s.name}</span>
                    <span className="font-bold text-green-500 rtl:mr-2 ltr:ml-2">{s.present}×</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              {t.pendingInPeriodTitle || 'Pending in Period'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {insights.financials.recentPendingAmount} {currencySymbol}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {insights.financials.recentPendingCount !== 1
                ? (t.fromUnpaidTransactionsPlural || 'from {count} unpaid transactions').replace('{count}', insights.financials.recentPendingCount.toString())
                : (t.fromUnpaidTransactions || 'from {count} unpaid transaction').replace('{count}', insights.financials.recentPendingCount.toString())
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart data={attendanceData} dict={dict} />
        <PaymentsChart data={paymentData} dict={dict} currency={currencySymbol} />
      </div>
    </div>
  );
}
