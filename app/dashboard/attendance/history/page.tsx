import { getHistoricalSessions, getAllHistoricalRecords, getAllSessions } from '@/actions/attendance';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDictionary } from '@/lib/i18n';
import { buttonVariants } from '@/components/ui/button';
import dayjs from 'dayjs';
import Link from 'next/link';
import { Users, CheckCircle2, XCircle, Clock, CalendarDays, ExternalLink, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HistoryMainFilters } from './history-main-filters';
import { formatTime } from '@/lib/utils';

export default async function HistoryPage(props: { searchParams: Promise<{ q?: string, date?: string, grade?: string, session?: string, status?: string, view?: string }> }) {
  const resolvedSearchParams = await props.searchParams;
  const dict = await getDictionary();
  const allSessions = await getAllSessions();

  const viewMode = resolvedSearchParams.view || 'sessions';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dict.historyPage.title}</h1>
        <p className="text-muted-foreground mt-1">{dict.historyPage.subtitle}</p>
      </div>

      <HistoryMainFilters 
        dict={dict}
        sessions={allSessions}
        currentQuery={resolvedSearchParams.q}
        currentDate={resolvedSearchParams.date}
        currentGrade={resolvedSearchParams.grade}
        currentSessionId={resolvedSearchParams.session}
        currentStatus={resolvedSearchParams.status}
        viewMode={viewMode}
      />

      {viewMode === 'sessions' ? (
        <SessionsView dict={dict} searchParams={resolvedSearchParams} />
      ) : (
        <RecordsView dict={dict} searchParams={resolvedSearchParams} />
      )}
    </div>
  );
}

async function SessionsView({ dict, searchParams }: { dict: any, searchParams: any }) {
  const sessions = await getHistoricalSessions(searchParams.date, searchParams.grade, searchParams.session);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.length === 0 ? (
        <div className="col-span-full p-8 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
          {dict.historyPage.noSessions}
        </div>
      ) : (
        sessions.map((session: any) => {
          const dateStr = dayjs(session.date).format('YYYY-MM-DD');
          const total = session.totalStudents;
          const present = session.totalPresent;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

          return (
            <Card key={`${session.sessionId}-${dateStr}`} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 bg-muted/30 border-b flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{dayjs(session.date).format('MMMM D, YYYY')}</span>
                  </div>
                  <Badge variant="outline" className="font-normal text-xs bg-background">
                    {(dict.grades as any)[`grade${session.grade}`] || session.grade} • {formatTime(session.time, '12h')}
                  </Badge>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-primary">{percentage}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{dict.historyPage.columns.percentage}</span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col p-3 bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{dict.historyPage.columns.total}</span>
                    </div>
                    <span className="text-xl font-semibold">{total}</span>
                  </div>
                  
                  <div className="flex flex-col p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{dict.historyPage.columns.present}</span>
                    </div>
                    <span className="text-xl font-semibold">{present}</span>
                  </div>

                  <div className="flex flex-col p-3 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{dict.historyPage.columns.absent}</span>
                    </div>
                    <span className="text-xl font-semibold">{session.totalAbsent}</span>
                  </div>

                  <div className="flex flex-col p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{dict.historyPage.columns.late}</span>
                    </div>
                    <span className="text-xl font-semibold">{session.totalLate}</span>
                  </div>
                </div>

                <Link href={`/dashboard/attendance/history/${session.sessionId}/${dateStr}`} className={buttonVariants({ variant: "outline", className: "w-full justify-between group" })}>
                  {dict.historyPage.viewDetails}
                  <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

async function RecordsView({ dict, searchParams }: { dict: any, searchParams: any }) {
  const { records } = await getAllHistoricalRecords(
    searchParams.date,
    searchParams.grade,
    searchParams.session,
    searchParams.status,
    searchParams.q,
    0,
    500
  );

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>{dict.historyPage.studentColumns.id}</TableHead>
              <TableHead>{dict.historyPage.studentColumns.name}</TableHead>
              <TableHead>{dict.historyPage.columns.date}</TableHead>
              <TableHead>{dict.historyPage.columns.session}</TableHead>
              <TableHead>{dict.historyPage.studentColumns.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {dict.historyPage?.noRecords || "No attendance records found."}
                </TableCell>
              </TableRow>
            ) : (
              records.map((record: any) => {
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                return (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {record.student.studentId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                          {record.student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{record.student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{dayjs(record.date).format('MMM D, YYYY')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal whitespace-nowrap">
                        {(dict.grades as any)[`grade${record.session.grade}`] || record.session.grade} • {days[record.session.dayOfWeek]} • {formatTime(record.session.time, '12h')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' :
                          record.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20' :
                          'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                        }
                      >
                        {record.status === 'PRESENT' ? dict.historyPage.status.present :
                         record.status === 'ABSENT' ? dict.historyPage.status.absent :
                         dict.historyPage.status.late}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
