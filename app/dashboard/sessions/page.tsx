import { getSessions } from '@/actions/sessions';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AddSessionButton } from './add-session-button';
import { Badge } from '@/components/ui/badge';
import { getDictionary } from '@/lib/i18n';
import { EditSessionButton } from '@/components/edit-session-button';
import { SessionsFilters } from './sessions-filters';
import { getSettings } from '@/actions/settings';
import { formatTime } from '@/lib/utils';

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ q?: string, grade?: string, day?: string }> }) {
  const authSession = await getSession();
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const resolvedSearchParams = await searchParams;
  const sessions = await getSessions(
    resolvedSearchParams.q || '',
    resolvedSearchParams.grade || '',
    resolvedSearchParams.day || ''
  );
  const dict = await getDictionary();
  const settings = await getSettings();
  const timeFormat = settings.timeFormat || '12h';

  const DAYS = [
    dict.sessionsPage.days.sunTueThu,
    dict.sessionsPage.days.satMonWed,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.sessionsPage.title}</h1>
          <p className="text-muted-foreground mt-1">{dict.sessionsPage.subtitle}</p>
        </div>
        <AddSessionButton dict={dict} />
      </div>

      <SessionsFilters 
        dict={dict} 
        currentQuery={resolvedSearchParams.q || ''}
        currentGrade={resolvedSearchParams.grade || ''}
        currentDay={resolvedSearchParams.day || ''}
      />

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>{dict.sessionsPage.columns.day}</TableHead>
                <TableHead>{dict.sessionsPage.columns.time}</TableHead>
                <TableHead>{dict.sessionsPage.columns.grade}</TableHead>
                <TableHead>{dict.sessionsPage.columns.enrolled}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                    {dict.sessionsPage.noSessions}
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{DAYS[session.dayOfWeek]}</TableCell>
                    <TableCell className="font-mono">{formatTime(session.time, timeFormat)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {session.grade === '1' ? dict.grades.grade1 : 
                         session.grade === '2' ? dict.grades.grade2 : 
                         session.grade === '3' ? dict.grades.grade3 : session.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session._count.students}
                    </TableCell>
                    <TableCell>
                      <EditSessionButton session={session} dict={dict} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
