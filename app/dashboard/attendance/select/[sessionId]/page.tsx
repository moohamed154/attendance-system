import { getSessionAttendance } from '@/actions/attendance/attendance';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import { getSettings } from '@/actions/settings/settings';
import { formatTime } from '@/lib/utils';
import { AttendanceMethodSelector } from '@/components/attendance/AttendanceMethodSelector';
import dayjs from 'dayjs';

export default async function AttendanceSelectPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { sessionId } = await params;
  const resolvedSearchParams = await searchParams;
  const targetDate = resolvedSearchParams.date ? dayjs(resolvedSearchParams.date).startOf('day').toDate() : undefined;

  const dict = await getDictionary();
  const settings = await getSettings();

  const session = await getSessionAttendance(sessionId, targetDate);

  if (!session) {
    notFound();
  }

  const gradeName = session.grade === '1' ? dict.grades.grade1 : 
                    session.grade === '2' ? dict.grades.grade2 : 
                    session.grade === '3' ? dict.grades.grade3 : session.grade;

  const dayName = session.dayOfWeek === 0 ? dict.sessionsPage.days.sunTueThu : dict.sessionsPage.days.satMonWed;
  const formattedTime = formatTime(session.time, settings.timeFormat || '12h');

  return (
    <AttendanceMethodSelector
      sessionId={sessionId}
      gradeName={gradeName}
      formattedTime={formattedTime}
      dayName={dayName}
      dict={dict}
    />
  );
}
