import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStudentById } from '@/actions/students';
import { getAllSessions } from '@/actions/attendance';
import { getDictionary } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import dayjs from 'dayjs';
import { ArrowLeft, CheckCircle2, Clock, DollarSign, Activity, Wallet, Banknote } from 'lucide-react';
import Link from 'next/link';
import { EditStudentButton } from '@/components/edit-student-button';
import { RecordPaymentButton } from './record-payment-button';
import { RecordTransactionButton } from '../../payments/record-transaction-button';
import { QuickAttendanceButton } from './quick-attendance-button';
import { getSettings } from '@/actions/settings';

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const authSession = await getSession();
  if (!authSession) {
    redirect('/login');
  }

  const student = await getStudentById(resolvedParams.id);
  if (!student) {
    redirect('/dashboard/students');
  }

  const dict = await getDictionary();
  const allSessions = await getAllSessions();
  const settings = await getSettings();
  const currencySymbol = settings.currency || dict.paymentsPage.currency;

  // Statistics
  const totalSessions = student.attendances.length;
  const presentCount = student.attendances.filter((a: any) => a.status === 'PRESENT').length;
  const absentCount = student.attendances.filter((a: any) => a.status === 'ABSENT').length;
  const lateCount = student.attendances.filter((a: any) => a.status === 'LATE').length;
  const presentPercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  // Payments
  const expectedRevenue = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalPaid = student.payments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);
  const remainingBalance = expectedRevenue - totalPaid;
  const collectionPercentage = expectedRevenue > 0 ? Math.round((totalPaid / expectedRevenue) * 100) : 0;

  // Chronological Transactions
  const allTransactions = student.payments.flatMap((p: any) => 
    p.transactions.map((t: any) => ({
      ...t,
      month: p.month,
      year: p.year,
      paymentAmount: p.amount,
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentMonthAttendances = student.attendances.filter((a: any) => dayjs(a.date).month() === dayjs().month() && dayjs(a.date).year() === dayjs().year());
  const currentMonthPresent = currentMonthAttendances.filter((a: any) => a.status === 'PRESENT').length;
  const currentMonthTotal = currentMonthAttendances.length;

  const currentMonthPayment = student.payments.find((p: any) => p.month === dayjs().month() + 1 && p.year === dayjs().year());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/students"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
          <p className="text-muted-foreground mt-1">{dict.studentProfile?.title || 'Student Profile & History'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Info & Stats */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{dict.studentProfile?.information || 'Information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.internalId || 'Internal ID'}</span>
                <span className="font-medium">{student.id.slice(-6)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.excelId || 'Excel ID'}</span>
                <span className="font-medium">{student.studentId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.grade || 'Grade'}</span>
                <span className="font-medium">{student.grade}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.session || 'Session'}</span>
                <span className="font-medium text-right">
                  {student.session ? `${dict.studentProfile?.daysArray?.[student.session.dayOfWeek] || days[student.session.dayOfWeek]} - ${student.session.time}` : (dict.studentProfile?.noSession || 'No Session')}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.monthlyFee || 'Monthly Fee'}</span>
                <span className="font-medium">{student.monthlyFee || 0} {currencySymbol}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.studentType || 'Student Type'}</span>
                <span className="font-medium">{student.studentType || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.notes || 'Notes'}</span>
                <span className="font-medium">{student.notes || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.createdDate || 'Created Date'}</span>
                <span className="font-medium">{student.createdDate || dayjs(student.createdAt).format('YYYY-MM-DD')}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">{dict.studentProfile?.lastUpdated || 'Last Updated'}</span>
                <span className="font-medium">{dayjs(student.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.studentProfile?.financialSummary || 'Financial Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{dict.studentProfile?.collectionPercentage || 'Collection %'}</span>
                <Badge variant={collectionPercentage >= 100 ? 'default' : collectionPercentage > 0 ? 'secondary' : 'destructive'} className="text-lg">
                  {collectionPercentage}%
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2 mt-4">
                <span className="text-muted-foreground flex items-center"><Banknote className="w-4 h-4 mr-2 text-primary"/> {dict.studentProfile?.totalExpected || 'Total Expected'}</span>
                <span className="font-medium">{expectedRevenue} {currencySymbol}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center"><Wallet className="w-4 h-4 mr-2 text-green-500"/> {dict.studentProfile?.totalPaid || 'Total Paid'}</span>
                <span className="font-medium text-green-600">{totalPaid} {currencySymbol}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground flex items-center"><Activity className="w-4 h-4 mr-2 text-destructive"/> {dict.studentProfile?.remaining || 'Remaining'}</span>
                <span className="font-bold text-destructive">{remainingBalance} {currencySymbol}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.studentProfile?.attendanceStats || 'Attendance Stats'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{dict.studentProfile?.attendancePercentage || 'Attendance %'}</span>
                <Badge variant={presentPercentage >= 75 ? 'default' : 'destructive'} className="text-lg">
                  {presentPercentage}%
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2 mt-4">
                <span className="text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> {dict.studentProfile?.present || 'Present'}</span>
                <span className="font-medium">{presentCount}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-red-500"/> {dict.studentProfile?.absent || 'Absent'}</span>
                <span className="font-medium">{absentCount}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2 text-yellow-500"/> {dict.studentProfile?.late || 'Late'}</span>
                <span className="font-medium">{lateCount}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-semibold">{dict.studentProfile?.totalSessions || 'Total Sessions'}</span>
                <span className="font-bold">{totalSessions}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground font-semibold">{dict.studentProfile?.currentMonth || 'Current Month'}</span>
                <span className="font-bold">{currentMonthPresent} / {currentMonthTotal}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary flex items-center justify-between">
                {dict.studentProfile?.currentMonthSubscription || 'Current Month Subscription'}
                <Badge variant="outline" className="text-xs font-normal border-primary/20 text-primary">
                  {dayjs().format('MMMM YYYY')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentMonthPayment ? (
                <>
                  <div className="flex justify-between border-b border-primary/10 pb-2 text-sm">
                    <span className="text-muted-foreground">{dict.studentProfile?.amount || 'Amount'}</span>
                    <span className="font-medium">{currentMonthPayment.amount} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-primary/10 pb-2">
                    <span className="text-muted-foreground">{dict.studentProfile?.amountPaid || 'Amount Paid'}</span>
                    <span className="font-medium text-green-600 dark:text-green-500">{(currentMonthPayment.amountPaid || 0)} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-sm pb-2">
                    <span className="text-muted-foreground">{dict.studentProfile?.remaining || 'Remaining'}</span>
                    <span className={`font-bold ${currentMonthPayment.amount - (currentMonthPayment.amountPaid || 0) > 0 ? 'text-destructive' : 'text-primary'}`}>
                      {currentMonthPayment.amount - (currentMonthPayment.amountPaid || 0)} {currencySymbol}
                    </span>
                  </div>
                  {currentMonthPayment.status !== 'PAID' && (
                    <div className="pt-2">
                      <RecordTransactionButton 
                        payment={{
                          id: currentMonthPayment.id,
                          amount: currentMonthPayment.amount,
                          amountPaid: currentMonthPayment.amountPaid,
                          status: currentMonthPayment.status,
                          month: currentMonthPayment.month,
                          year: currentMonthPayment.year,
                          student: { name: student.name }
                        }} 
                        currencySymbol={currencySymbol} 
                        dict={dict}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-muted-foreground text-sm">{dict.studentProfile?.noSubscription || 'No subscription generated for'} {dayjs().format('MMMM')} {dict.studentProfile?.yet || 'yet.'}</p>
                  <Link href={`/dashboard/payments/new-month`}>
                    <div className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full">
                      {dict.studentProfile?.startNewMonth || 'Start New Month'}
                    </div>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.studentProfile?.quickActions || 'Quick Actions'}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <EditStudentButton 
                student={{
                  id: student.id,
                  name: student.name,
                  grade: student.grade,
                  studentType: student.studentType,
                  monthlyFee: student.monthlyFee,
                  importMonth: student.importMonth,
                  notes: student.notes,
                  sessionId: student.sessionId
                }} 
                dict={dict} 
                sessions={allSessions.map(s => ({
                  id: s.id,
                  time: s.time,
                  grade: s.grade,
                  dayOfWeek: s.dayOfWeek
                }))} 
              />
              <Link href={`/dashboard/payments?q=${student.studentId}`}>
                <div className="inline-flex w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  <DollarSign className="w-4 h-4" /> {dict.studentProfile?.managePayments || 'Manage Payments'}
                </div>
              </Link>
              <QuickAttendanceButton 
                student={{ id: student.id, name: student.name }} 
                session={student.session} 
                dict={dict}
              />
              <Link 
                href={`/dashboard/attendance?session=${student.sessionId}`}
                className="inline-flex w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {dict.studentProfile?.openAttendancePage || 'Open Attendance Page'}
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{dict.studentProfile?.subscriptionDues || 'Subscription Dues'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.studentProfile?.month || 'Month'}</TableHead>
                    <TableHead>{dict.studentProfile?.due || 'Due'}</TableHead>
                    <TableHead>{dict.studentProfile?.paid || 'Paid'}</TableHead>
                    <TableHead>{dict.studentProfile?.remaining || 'Remaining'}</TableHead>
                    <TableHead>{dict.studentProfile?.status || 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">{dict.studentProfile?.noSubscriptions || 'No subscriptions recorded'}</TableCell>
                    </TableRow>
                  ) : (
                    student.payments.map((p: any) => {
                      const amountPaid = p.amountPaid || 0;
                      const rem = p.amount - amountPaid;
                      return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{dayjs().month(p.month - 1).format('MMMM')} {p.year}</TableCell>
                        <TableCell>{p.amount} {currencySymbol}</TableCell>
                        <TableCell className="text-green-600">{amountPaid} {currencySymbol}</TableCell>
                        <TableCell className={rem > 0 ? "text-destructive" : ""}>{rem} {currencySymbol}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'PAID' ? 'default' : p.status === 'PARTIAL' ? 'secondary' : 'destructive'} 
                             className={
                               p.status === 'PAID' ? 'bg-green-500 hover:bg-green-600 text-white' : 
                               p.status === 'PARTIAL' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''
                             }>
                            {((dict.paymentsPage?.status as any)?.[p.status.toLowerCase()]) || p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )})
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.studentProfile?.paymentTimeline || 'Payment Timeline'}</CardTitle>
            </CardHeader>
            <CardContent>
              {allTransactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg border-dashed">
                  {dict.studentProfile?.noTransactions || 'No payment transactions found.'}
                </div>
              ) : (
                <div className="relative border-l border-muted ml-4 space-y-6 pb-4">
                  {allTransactions.map((tx: any) => (
                    <div key={tx.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1 border-2 border-background ring-2 ring-primary/20"></div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <p className="font-semibold">{tx.amount} {currencySymbol}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {dict.studentProfile?.paymentFor || 'Payment for'} {dayjs().month(tx.month - 1).format('MMMM')} {tx.year} {dict.studentProfile?.subscription || 'subscription'}
                          </p>
                          {tx.paymentMethod && (
                            <Badge variant="outline" className="mt-2 mr-2 text-[10px]">{tx.paymentMethod}</Badge>
                          )}
                          {tx.receiptNumber && (
                            <Badge variant="outline" className="mt-2 text-[10px]">{dict.studentProfile?.receipt || 'Receipt'}: {tx.receiptNumber}</Badge>
                          )}
                          {tx.notes && (
                            <p className="text-xs text-muted-foreground italic mt-2">"{tx.notes}"</p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground shrink-0 whitespace-nowrap">
                          {dayjs(tx.date).format('MMM D, YYYY h:mm A')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.studentProfile?.recentAttendance || 'Recent Attendance'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.studentProfile?.date || 'Date'}</TableHead>
                    <TableHead>{dict.studentProfile?.status || 'Status'}</TableHead>
                    <TableHead>{dict.studentProfile?.session || 'Session'}</TableHead>
                    <TableHead>{dict.studentProfile?.day || 'Day'}</TableHead>
                    <TableHead>{dict.studentProfile?.time || 'Time'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.attendances.slice(0, 10).map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{dayjs(a.date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          a.status === 'PRESENT' ? 'border-green-500 text-green-500 bg-green-500/10' :
                          a.status === 'ABSENT' ? 'border-red-500 text-red-500 bg-red-500/10' :
                          'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                        }>
                          {((dict.historyPage?.status as any)?.[a.status.toLowerCase()]) || a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.session ? a.session.grade : '-'}</TableCell>
                      <TableCell>{a.session ? (dict.studentProfile?.daysArray?.[a.session.dayOfWeek] || days[a.session.dayOfWeek]) : '-'}</TableCell>
                      <TableCell>{a.session ? a.session.time : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {student.attendances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                        {dict.studentProfile?.noAttendance || 'No attendance records'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
