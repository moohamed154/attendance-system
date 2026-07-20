import { getStudents } from '@/actions/students/students';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getSession } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { encryptStudentToken } from '@/lib/qr/token';

const AddStudentButton = dynamic(() => import('../../../components/students/add-student-button').then(mod => mod.AddStudentButton), {
  loading: () => <Skeleton className="h-10 w-32 rounded-xl" />
});
import { EditStudentButton } from '@/components/students/edit-student-button';
import { StudentsFilters } from '../../../components/students/students-filters';
import { getSettings } from '@/actions/settings/settings';
import { formatTime } from '@/lib/utils';
import Link from 'next/link';
import { Pagination } from '@/components/shared/pagination';

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string, grade?: string, sessionId?: string, page?: string }> }) {
  const authSession = await getSession();
  const isAdmin = authSession?.role === 'ADMIN';
  const dict = await getDictionary();
  const resolvedSearchParams = await searchParams;
  
  const page = Number(resolvedSearchParams.page || '') || 1;
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const { data: students, total } = await getStudents(
    resolvedSearchParams.q || '',
    resolvedSearchParams.grade || '',
    resolvedSearchParams.sessionId || '',
    skip,
    pageSize
  );
  
  const allSessions = await prisma.session.findMany({ orderBy: { time: 'asc' } });
  const settings = await getSettings();
  const timeFormat = settings.timeFormat || '12h';
  const currencySymbol = settings.currency || dict.paymentsPage.currency;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.studentsPage.title}</h1>
          <p className="text-muted-foreground mt-1">
            {dict.studentsPage.totalActive ? dict.studentsPage.totalActive.replace('{total}', total.toString()) : `Total: ${total} active students`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link 
              href="/print-cards" 
              className={buttonVariants({ variant: 'outline', className: "gap-2 whitespace-nowrap hidden sm:flex border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors" })}
            >
              <Printer className="w-4 h-4" />
              {dict.studentPortal?.printCard || 'Print All Cards'}
            </Link>
          )}
          {isAdmin && <AddStudentButton sessions={allSessions} dict={dict} timeFormat={timeFormat} />}
        </div>
      </div>

      <StudentsFilters 
        dict={dict} 
        sessions={allSessions} 
        currentQuery={resolvedSearchParams.q || ''}
        currentGrade={resolvedSearchParams.grade || ''}
        currentSessionId={resolvedSearchParams.sessionId || ''}
        timeFormat={timeFormat}
      />

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card pb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px] text-start">{dict.studentsPage.columns.id}</TableHead>
                <TableHead className="w-[200px] text-start">{dict.studentsPage.columns.name}</TableHead>
                <TableHead className="w-[150px] text-start">{dict.studentsPage.columns.studentPhone || 'Student Phone'}</TableHead>
                <TableHead className="w-[150px] text-start">{dict.studentsPage.columns.parentPhone || 'Parent Phone'}</TableHead>
                <TableHead className="w-[100px] text-start">{dict.studentsPage.columns.grade}</TableHead>
                <TableHead className="w-[100px] text-start">{dict.studentsPage.columns.type}</TableHead>
                <TableHead className="w-[100px] text-start">{dict.studentsPage.columns.price}</TableHead>
                <TableHead className="w-[100px] text-start">{dict.studentsPage.columns.month}</TableHead>
                <TableHead className="text-start">{dict.studentsPage.columns.sessions || 'Session'}</TableHead>
                <TableHead className="text-start max-w-[200px]">{dict.studentsPage.columns.notes}</TableHead>
                <TableHead className="w-[120px] text-center">{dict.general.actions || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center p-8 text-muted-foreground">
                    {dict.studentsPage.noStudents}
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-muted-foreground text-start">{student.studentId}</TableCell>
                    <TableCell className="font-medium text-lg text-start">
                      <Link href={`/dashboard/students/${student.id}`} className="hover:underline decoration-primary underline-offset-4">
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-start font-mono text-sm">{student.studentPhone}</TableCell>
                    <TableCell className="text-start font-mono text-sm">{student.parentPhone || '-'}</TableCell>
                    <TableCell className="text-start">
                      <Badge variant="outline">
                        {student.grade === '1' ? dict.grades.grade1 : 
                         student.grade === '2' ? dict.grades.grade2 : 
                         student.grade === '3' ? dict.grades.grade3 : (student.grade || '-')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      {student.studentType === 'Male' 
                        ? dict.studentsPage?.gender?.male || 'Male' 
                        : student.studentType === 'Female' 
                          ? dict.studentsPage?.gender?.female || 'Female' 
                          : student.studentType || '-'}
                    </TableCell>
                    <TableCell className="text-start font-medium text-green-600 dark:text-green-400">
                      {student.monthlyFee ? (
                        <>{student.monthlyFee} <span className="text-xs font-normal text-muted-foreground">{currencySymbol}</span></>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-start">{student.importMonth || '-'}</TableCell>
                    <TableCell className="text-start">
                      {student.session ? (
                        <Badge variant="secondary" className="rounded-full">
                          {formatTime(student.session.time, timeFormat)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-start text-sm text-muted-foreground truncate max-w-[200px]" title={student.notes || ''}>
                      {student.notes || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/student/card/${encryptStudentToken(student.id)}`} 
                          target="_blank"
                          className={buttonVariants({ variant: "ghost", size: "icon", className: "h-9 w-9 rounded-xl border border-border/20" })}
                          title={dict.studentPortal?.printCard || "Print Card"}
                        >
                          <Printer className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Link>
                        <EditStudentButton student={student} dict={dict} sessions={allSessions} timeFormat={timeFormat} />
                      </div>
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
