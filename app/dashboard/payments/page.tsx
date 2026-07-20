import { getPayments } from '@/actions/payments/payments';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AddPaymentButton } from '../../../components/payments/add-payment-button';
import { RecordTransactionButton } from '../../../components/payments/record-transaction-button';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { getDictionary } from '@/lib/i18n';
import { EditPaymentButton } from '../../../components/payments/edit-payment-button';
import { PaymentsFilters } from '../../../components/payments/payments-filters';
import { SimplePagination } from '@/components/shared/simple-pagination';

import { getSettings } from '@/actions/settings/settings';
import Link from 'next/link';
import { GenerateDuesButton } from '../../../components/payments/generate-dues-button';
import { DollarSign, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string, month?: string, year?: string, page?: string }> }) {
  const authSession = await getSession();
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const resolvedSearchParams = await searchParams;
  const currentYear = resolvedSearchParams.year || '' ? parseInt(resolvedSearchParams.year || '') : dayjs().year();
  const currentMonth = resolvedSearchParams.month || '' ? parseInt(resolvedSearchParams.month || '') : dayjs().month() + 1;

  const payments = await getPayments(
    resolvedSearchParams.q || '',
    resolvedSearchParams.status || '',
    currentMonth.toString()
  );
  
  // Filter for the selected year just in case
  const filteredPayments = payments.filter(p => p.year === currentYear);

  const students = await prisma.student.findMany({
    where: { isArchived: false },
    select: { id: true, name: true, studentId: true },
    orderBy: { name: 'asc' }
  });
  const dict = await getDictionary();
  const settings = await getSettings();
  const currencySymbol = settings.currency || dict.paymentsPage.currency;

  // Monthly Summary Math
  const totalStudents = filteredPayments.length;
  const fullyPaid = filteredPayments.filter(p => p.status === 'PAID').length;
  const partiallyPaid = filteredPayments.filter(p => p.status === 'PARTIAL').length;
  const unpaid = filteredPayments.filter(p => p.status === 'UNPAID').length;

  const expectedRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectedRevenue = filteredPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const remainingRevenue = expectedRevenue - collectedRevenue;
  const collectionPercentage = expectedRevenue > 0 ? Math.round((collectedRevenue / expectedRevenue) * 100) : 0;

  // Pagination Math
  const pageStr = resolvedSearchParams.page;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const limit = 50;
  const totalPages = Math.ceil(filteredPayments.length / limit);
  const paginatedPayments = filteredPayments.slice((page - 1) * limit, page * limit);
  const isArabic = dict?.paymentsPage?.pageTitle === "مركز الدفع الشهري" || dict?.paymentsPage?.pageTitle === "المدفوعات";

  // Generate Month Tabs (last 3 months, current, next 2)
  const tabs = [];
  for (let i = -3; i <= 2; i++) {
    const d = dayjs().add(i, 'month');
    tabs.push({ month: d.month() + 1, year: d.year(), label: d.format('MMMM YYYY') });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict?.paymentsPage?.pageTitle || 'Monthly Payment Center'}</h1>
          <p className="text-muted-foreground mt-1">{dict?.paymentsPage?.pageSubtitle || 'Manage subscriptions and partial payments.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/dashboard/payments/new-month">
            <Button variant="outline" className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20">
              {dict.newMonthWizard?.title || 'Start New Month'}
            </Button>
          </Link>
          <GenerateDuesButton dict={dict} />
          <AddPaymentButton students={students} dict={dict} />
        </div>
      </div>

      {/* Month Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => {
          const isActive = tab.month === currentMonth && tab.year === currentYear;
          return (
            <Link key={`${tab.month}-${tab.year}`} href={`/dashboard/payments?month=${tab.month}&year=${tab.year}`}>
              <Badge 
                variant={isActive ? 'default' : 'secondary'} 
                className={`px-4 py-2 text-sm whitespace-nowrap rounded-full cursor-pointer ${isActive ? 'bg-primary' : 'hover:bg-muted'}`}
              >
                {(dict?.paymentsPage?.months as any)?.[tab.month.toString()] || tab.label.split(' ')[0]} {tab.year}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Monthly Summary Widget */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/50 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{dict?.paymentsPage?.expectedRevenue || 'Expected Revenue'}</p>
              <h3 className="text-2xl font-bold mt-1">{expectedRevenue} <span className="text-sm font-normal">{currencySymbol}</span></h3>
              <p className="text-xs text-muted-foreground mt-1">{dict?.paymentsPage?.studentsCount ? dict.paymentsPage.studentsCount.replace('{count}', totalStudents.toString()) : `${totalStudents} Students`}</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-full"><DollarSign className="w-5 h-5" /></div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-border/50 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{dict?.paymentsPage?.collected || 'Collected'}</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-500">{collectedRevenue} <span className="text-sm font-normal">{currencySymbol}</span></h3>
              <p className="text-xs text-muted-foreground mt-1">{dict?.paymentsPage?.collectionRate ? dict.paymentsPage.collectionRate.replace('{rate}', collectionPercentage.toString()) : `${collectionPercentage}% Collection Rate`}</p>
            </div>
            <div className="p-3 bg-green-500/10 text-green-600 rounded-full"><CheckCircle2 className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{dict?.paymentsPage?.remaining || 'Remaining'}</p>
              <h3 className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-500">{remainingRevenue} <span className="text-sm font-normal">{currencySymbol}</span></h3>
              <p className="text-xs text-muted-foreground mt-1">{dict?.paymentsPage?.partialAndUnpaid ? dict.paymentsPage.partialAndUnpaid.replace('{partial}', partiallyPaid.toString()).replace('{unpaid}', unpaid.toString()) : `${partiallyPaid} Partial, ${unpaid} Unpaid`}</p>
            </div>
            <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-full"><AlertCircle className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{dict?.paymentsPage?.fullyPaidStudents || 'Fully Paid Students'}</p>
              <h3 className="text-2xl font-bold mt-1">{fullyPaid}</h3>
              <p className="text-xs text-muted-foreground mt-1">{dict?.paymentsPage?.outOfTotal ? dict.paymentsPage.outOfTotal.replace('{total}', totalStudents.toString()) : `out of ${totalStudents}`}</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full"><TrendingUp className="w-5 h-5" /></div>
          </CardContent>
        </Card>
      </div>

      <PaymentsFilters 
        dict={dict} 
        currentQuery={resolvedSearchParams.q || ''}
        currentStatus={resolvedSearchParams.status || ''}
        currentMonth={currentMonth.toString()}
      />

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.student || 'Student'}</TableHead>
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.grade || 'Grade'}</TableHead>
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.monthlyFee || 'Monthly Fee'}</TableHead>
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.totalPaid || 'Total Paid'}</TableHead>
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.remaining || 'Remaining'}</TableHead>
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.status || 'Status'}</TableHead>
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.lastPayment || 'Last Payment'}</TableHead>
                <TableHead className="text-start">{dict?.paymentsPage?.columns?.transactions || 'Transactions'}</TableHead>
                <TableHead className="text-right">{dict?.paymentsPage?.columns?.action || 'Action'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center p-8 text-muted-foreground">
                    {dict?.paymentsPage?.noSubscriptionsMonth || 'No subscriptions found for this month.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => {
                  const amountPaid = payment.amountPaid || 0;
                  const remaining = payment.amount - amountPaid;
                  
                  return (
                  <TableRow key={payment.id} className="hover:bg-muted/20">
                    <TableCell className="text-start">
                      <div className="font-medium">
                        <Link href={`/dashboard/students/${payment.student.id}`} className="hover:underline decoration-primary underline-offset-4">
                          {payment.student.name}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{payment.student.studentId}</div>
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge variant="outline">{payment.student.grade || '-'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-start">
                      {payment.amount} <span className="text-xs text-muted-foreground">{currencySymbol}</span>
                    </TableCell>
                    <TableCell className="font-medium text-start text-green-600 dark:text-green-500">
                      {amountPaid} <span className="text-xs font-normal text-muted-foreground">{currencySymbol}</span>
                    </TableCell>
                    <TableCell className={`font-medium text-start ${remaining > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {remaining} <span className="text-xs font-normal text-muted-foreground">{currencySymbol}</span>
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge variant={payment.status === 'PAID' ? 'default' : payment.status === 'PARTIAL' ? 'secondary' : 'destructive'} 
                             className={
                               payment.status === 'PAID' ? 'bg-green-500 hover:bg-green-600 text-white' : 
                               payment.status === 'PARTIAL' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''
                             }>
                        {payment.status === 'PAID' ? `🟢 ${dict?.paymentsPage?.fullyPaid || 'Fully Paid'}` : payment.status === 'PARTIAL' ? `🟡 ${dict?.paymentsPage?.partiallyPaid || 'Partially Paid'}` : `🔴 ${dict?.paymentsPage?.unpaidStatus || 'Unpaid'}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-start text-sm text-muted-foreground">
                      {payment.paidAt ? dayjs(payment.paidAt).format('MMM D, YYYY') : 
                       (payment.transactions && payment.transactions.length > 0) ? dayjs(payment.transactions[0].date).format('MMM D, YYYY') : '-'}
                    </TableCell>
                    <TableCell className="text-start">
                      {payment.transactions?.length || 0}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <RecordTransactionButton payment={payment} currencySymbol={currencySymbol} dict={dict} />
                      <EditPaymentButton payment={payment} dict={dict} />
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <SimplePagination currentPage={page} totalPages={totalPages} isArabic={isArabic} />
    </div>
  );
}
