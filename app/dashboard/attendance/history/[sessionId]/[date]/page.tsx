import { getSessionHistoryDetails, getAvailableDatesForSession } from '@/actions/attendance';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDictionary } from '@/lib/i18n';
import { buttonVariants } from '@/components/ui/button';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { DeleteRecordButton } from './delete-record-button';
import { SessionHistoryExport } from './session-history-export';
import { HistoryFilters } from './history-filters';

export default async function HistoryDetailsPage(props: { params: Promise<{ sessionId: string, date: string }>, searchParams: Promise<{ q?: string, status?: string }> }) {
  const resolvedParams = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const dict = await getDictionary();
  const authSession = await getSession();
  const isAdmin = authSession?.role === 'ADMIN';

  const details = await getSessionHistoryDetails(resolvedParams.sessionId, resolvedParams.date);
  if (!details) return redirect('/dashboard/attendance/history');

  const { session, date, attendances } = details;
  const availableDates = await getAvailableDatesForSession(resolvedParams.sessionId);

  let filteredAttendances = attendances;
  if (resolvedSearchParams.q) {
    const qLower = resolvedSearchParams.q.toLowerCase();
    filteredAttendances = filteredAttendances.filter(a => 
      a.student.name.toLowerCase().includes(qLower) || 
      a.student.studentId.toLowerCase().includes(qLower)
    );
  }
  if (resolvedSearchParams.status && resolvedSearchParams.status !== 'ALL') {
    filteredAttendances = filteredAttendances.filter(a => a.status === resolvedSearchParams.status);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/attendance/history" className={buttonVariants({ variant: "ghost", size: "sm", className: "px-2 -ml-2 text-muted-foreground" })}>
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{dict.historyPage.sessionDetails}</h1>
          </div>
          <p className="text-muted-foreground">
            {dayjs(date).format('MMMM D, YYYY')} • {session.grade} • {session.time}
          </p>
        </div>
        <SessionHistoryExport 
          attendances={attendances}
          session={session}
          date={date}
          dict={dict}
        />
      </div>

      <HistoryFilters 
        dict={dict}
        sessionId={resolvedParams.sessionId}
        currentDate={resolvedParams.date}
        availableDates={availableDates}
        currentQuery={resolvedSearchParams.q}
        currentStatus={resolvedSearchParams.status}
      />

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-start">{dict.historyPage.studentColumns.id}</TableHead>
                <TableHead className="text-start">{dict.historyPage.studentColumns.name}</TableHead>
                <TableHead className="text-start">{dict.historyPage.studentColumns.status}</TableHead>
                <TableHead className="text-start">{dict.historyPage.studentColumns.recordedAt}</TableHead>
                <TableHead className="text-start">{dict.historyPage.studentColumns.recordedBy}</TableHead>
                {isAdmin && <TableHead className="text-end">{dict.historyPage.columns.action}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center p-8 text-muted-foreground">
                    {dict.attendancePage.noStudents}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendances.map((attendance) => {
                  const lastAudit = attendance.auditLogs?.[0];
                  
                  return (
                    <TableRow key={attendance.id} className="hover:bg-muted/20">
                      <TableCell className="text-start font-medium text-muted-foreground">
                        {attendance.student.studentId}
                      </TableCell>
                      <TableCell className="text-start font-semibold">
                        {attendance.student.name}
                      </TableCell>
                      <TableCell className="text-start">
                        <Badge 
                          variant="outline" 
                          className={`
                            ${attendance.status === 'PRESENT' ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' : ''}
                            ${attendance.status === 'ABSENT' ? 'border-rose-500/30 text-rose-600 bg-rose-500/10' : ''}
                            ${attendance.status === 'LATE' ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' : ''}
                          `}
                        >
                          {dict.historyPage.status[attendance.status.toLowerCase() as keyof typeof dict.historyPage.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-start text-sm text-muted-foreground">
                        {dayjs(attendance.updatedAt).format('h:mm A')}
                      </TableCell>
                      <TableCell className="text-start text-sm text-muted-foreground">
                        {lastAudit ? lastAudit.editedBy?.username || '-' : '-'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-end">
                          <DeleteRecordButton attendanceId={attendance.id} dict={dict} />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
