import { getStudents } from '@/actions/students';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getSession } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import Link from 'next/link';
import { ArchivedActions } from './archived-actions';

export default async function ArchivedStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const authSession = await getSession();
  const isAdmin = authSession?.role === 'ADMIN';
  const resolvedSearchParams = await searchParams;
  
  const { data: students, total } = await getStudents(
    resolvedSearchParams.q,
    'all',
    'all',
    0, // skip
    100, // take
    true // isArchived
  );
  
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive">Archived Students</h1>
          <p className="text-muted-foreground mt-1">Total: {total} archived students</p>
        </div>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px] text-start">ID</TableHead>
                <TableHead className="w-[200px] text-start">Name</TableHead>
                <TableHead className="w-[100px] text-start">Grade</TableHead>
                <TableHead className="text-start">Sessions</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                    No archived students found.
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
