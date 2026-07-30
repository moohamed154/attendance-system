import { getSessionAttendance, getPreviousSessionRecords } from '@/actions/attendance/attendance';
import { notFound } from 'next/navigation';
import { AttendanceList } from '@/components/attendance/attendance-list';
import dayjs from 'dayjs';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';


import { getDictionary } from '@/lib/i18n';
import { buttonVariants } from '@/components/ui/button';
import { getSettings } from '@/actions/settings/settings';
import { formatTime } from '@/lib/utils';

export default async function AttendancePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const dict = await getDictionary();
  const settings = await getSettings();
  
  const [session, previousSessionData] = await Promise.all([
    getSessionAttendance(sessionId),
    getPreviousSessionRecords(sessionId)
  ]);

  if (!session) {
    notFound();
  }

  // Format data for the client component
  const students = session.students.map(student => {
    const todayRecord = student.attendances[0];
    return {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      status: todayRecord ? todayRecord.status : null,
      paymentStatus: (student as any).paymentStatusInfo,
    };
  });

  const gradeName = session.grade === '1' ? dict.grades.grade1 : 
                    session.grade === '2' ? dict.grades.grade2 : 
                    session.grade === '3' ? dict.grades.grade3 : session.grade;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/attendance/select/${sessionId}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-full" })}>
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {gradeName} {dict.nav?.attendance || 'Attendance'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {formatTime(session.time, settings.timeFormat || '12h')} • {dayjs().format('dddd, MMMM D')}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <AttendanceList 
          sessionId={session.id} 
          initialStudents={students} 
          previousSessionData={previousSessionData}
        />
      </div>
    </div>
  );
}
