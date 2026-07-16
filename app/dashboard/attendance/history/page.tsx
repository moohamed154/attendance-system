import { getHistoricalSessions } from '@/actions/attendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/lib/i18n';
import { buttonVariants } from '@/components/ui/button';
import dayjs from 'dayjs';
import Link from 'next/link';
import { Users, CheckCircle2, XCircle, Clock, CalendarDays, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function HistoryPage() {
  const dict = await getDictionary();
  const sessions = await getHistoricalSessions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dict.historyPage.title}</h1>
        <p className="text-muted-foreground mt-1">{dict.historyPage.subtitle}</p>
      </div>

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
                      {session.grade} • {session.time}
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
    </div>
  );
}
