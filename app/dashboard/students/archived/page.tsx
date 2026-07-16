import { getStudents } from '@/actions/students';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getSession } from '@/lib/auth';
import { ArchivedActions } from './archived-actions';
import { getDictionary } from '@/lib/i18n';

export default async function ArchivedStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const authSession = await getSession();
  const isAdmin = authSession?.role === 'ADMIN';
  const resolvedSearchParams = await searchParams;
  const dict = await getDictionary();
  const t = dict.archivedStudentsPage || {};
  
  const { data: students, total } = await getStudents(
    resolvedSearchParams.q,
    'all',
    'all',
    0, // skip
    100, // take
    true // isArchived
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive">{t.pageTitle || 'Archived Students'}</h1>
          <p className="text-muted-foreground mt-1">{(t.totalArchived || 'Total: {total} archived students').replace('{total}', total.toString())}</p>
        </div>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px] text-start">{t.id || 'ID'}</TableHead>
                <TableHead className="w-[200px] text-start">{t.name || 'Name'}</TableHead>
                <TableHead className="w-[100px] text-start">{t.grade || 'Grade'}</TableHead>
                <TableHead className="text-start">{t.sessions || 'Sessions'}</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                    {t.noArchived || 'No archived students found.'}
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/20 opacity-75">
                    <TableCell className="font-mono text-muted-foreground text-start">{student.studentId}</TableCell>
                    <TableCell className="font-medium text-lg text-start">
                      {student.name}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge variant="outline">{student.grade || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      {student.session ? (
                        <Badge variant="secondary" className="rounded-full">
                          {student.session.grade} - {student.session.time}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <ArchivedActions studentId={student.id} studentName={student.name} />
                      )}
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
