import { getDictionary } from '@/lib/i18n';
import { getAllSessions, getSessionAttendance } from '@/actions/attendance/attendance';
import { AttendanceFilters } from '../../../components/attendance/attendance-filters';
import { AttendanceList } from '@/components/attendance/attendance-list';
import dayjs from 'dayjs';
import { getSettings } from '@/actions/settings/settings';
import { Suspense } from 'react';

export default async function AttendanceHistoryPage({ searchParams }: { searchParams: Promise<{ date?: string, sessionId?: string }> }) {
  const dict = await getDictionary();
  const sessions = await getAllSessions();
  const resolvedSearchParams = await searchParams;
  const settings = await getSettings();
  
  let selectedDateString = resolvedSearchParams.date;
  let selectedSessionId = resolvedSearchParams.sessionId;

  if (!selectedDateString || !selectedSessionId) {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const dayOfWeek = today.day();
    const todaySessions = sessions.filter((s: any) => s.dayOfWeek === dayOfWeek);

    if (!selectedDateString) {
      selectedDateString = todayFormatted;
    }

    if (!selectedSessionId && todaySessions.length > 0) {
      selectedSessionId = todaySessions[0].id;
    }
  }

  const selectedDate = selectedDateString ? dayjs(selectedDateString).startOf('day').toDate() : undefined;
  
  let sessionData = null;
  let formattedStudents: { id: string; studentId: string; name: string; status: any; paymentStatus: any }[] = [];

  if (selectedSessionId && selectedDate) {
    sessionData = await getSessionAttendance(selectedSessionId, selectedDate);
    if (sessionData) {
      formattedStudents = sessionData.students.map((student: any) => {
        const record = student.attendances[0];
        return {
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          status: record ? record.status : null,
          paymentStatus: student.paymentStatusInfo,
        };
      });
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dict.attendancePage.title}</h1>
        <p className="text-muted-foreground mt-1">{dict.attendancePage.subtitle}</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-4 border-b">
          <AttendanceFilters 
            sessions={sessions} 
            dict={dict} 
            initialDate={selectedDate}
            initialSessionId={selectedSessionId}
            timeFormat={settings.timeFormat || '12h'}
          />
        </div>
        
        <div className="min-h-[400px]">
          {!selectedSessionId || !selectedDate ? (
            <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
              {dict.attendancePage.noSession}
            </div>
          ) : sessionData ? (
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">{dict.loadingStates?.loading || 'Loading...'}</div>}>
              <AttendanceList 
                sessionId={sessionData.id} 
                initialStudents={formattedStudents}
                targetDate={selectedDate}
              />
            </Suspense>
          ) : null}
        </div>
      </div>
    </div>
  );
}
