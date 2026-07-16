import { getActivities } from '@/actions/activity';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { ActivityFilters } from './activity-filters';
import { Pagination } from '@/components/pagination';

export default async function ActivityLogPage({ searchParams }: { searchParams: Promise<{ q?: string, role?: string, page?: string }> }) {
  const authSession = await getSession();
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const { data: activities, total } = await getActivities(
    resolvedSearchParams.q, 
    resolvedSearchParams.role,
    skip,
    pageSize
  );
  
  const dict = await getDictionary();
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dict.activityPage.title}</h1>
        <p className="text-muted-foreground mt-1">{dict.activityPage.subtitle} (Total: {total})</p>
      </div>

      <ActivityFilters 
        dict={dict} 
        currentQuery={resolvedSearchParams.q}
        currentRole={resolvedSearchParams.role}
      />

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card pb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-start">{dict.activityPage.columns.date}</TableHead>
                <TableHead className="text-start">{dict.activityPage.columns.user}</TableHead>
                <TableHead className="text-start">{dict.activityPage.columns.action}</TableHead>
                <TableHead className="text-start">{dict.activityPage.columns.target}</TableHead>
                <TableHead className="text-start">{dict.activityPage.columns.description}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                    {dict.activityPage.noActivities}
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-muted/20">
                    <TableCell className="text-start text-sm text-muted-foreground whitespace-nowrap">
                      {dayjs(activity.createdAt).format('MMM D, YYYY h:mm A')}
                    </TableCell>
                    <TableCell className="text-start font-medium">
                      <div className="flex items-center gap-2">
                        {activity.user?.username || 'System'}
                        {activity.role === 'ADMIN' && (
                          <Badge variant="default" className="text-[10px] bg-primary">Admin</Badge>
                        )}
                        {activity.role === 'ASSISTANT' && (
                          <Badge variant="secondary" className="text-[10px]">Assistant</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge variant="outline" className="font-semibold bg-background">
                        {activity.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-start max-w-xs truncate" title={activity.target || ''}>
                      {activity.target || '-'}
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground text-sm max-w-sm truncate" title={activity.description || ''}>
                      {activity.description || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 px-4">
          <Pagination totalPages={totalPages} />
        </div>
      </Card>
    </div>
  );
}
