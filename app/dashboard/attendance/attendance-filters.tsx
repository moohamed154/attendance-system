'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/utils';
import { useState } from 'react';
import { Dictionary } from '@/lib/i18n';

export function AttendanceFilters({ sessions, dict, initialDate, initialSessionId, timeFormat }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [sessionId, setSessionId] = useState<string>(initialSessionId || '');

  const updateFilters = (newDate: Date | undefined, newSessionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newDate) {
      params.set('date', dayjs(newDate).format('YYYY-MM-DD'));
    } else {
      params.delete('date');
    }
    
    if (newSessionId) {
      params.set('sessionId', newSessionId);
    } else {
      params.delete('sessionId');
    }
    
    router.push(`/dashboard/attendance?${params.toString()}`);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    updateFilters(newDate, sessionId);
  };

  const handleSessionChange = (newSessionId: string | null) => {
    const id = newSessionId ?? '';
    setSessionId(id);
    updateFilters(date, id);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 sm:max-w-xs">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-start font-normal h-12 rounded-xl",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-4 h-4 mr-2 ml-2" />
              {date ? dayjs(date).format('MMMM D, YYYY') : <span>{dict.attendancePage.selectDate}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 sm:max-w-xs">
        <Select value={sessionId} onValueChange={handleSessionChange}>
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder={dict.attendancePage.selectSession}>
              {sessionId && sessionId !== 'all' && sessions.find((s: any) => s.id === sessionId)
                ? (() => {
                    const s = sessions.find((s: any) => s.id === sessionId);
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const gradeKey = 'grade' + s.grade;
                    return `${dict.grades[gradeKey] || s.grade} • ${days[s.dayOfWeek]} • ${formatTime(s.time, timeFormat || '12h')}`;
                  })()
                : dict.attendancePage.selectSession}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sessions.map((session: any) => {
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              return (
                <SelectItem key={session.id} value={session.id}>
                  {dict.grades[`grade${session.grade}`] || session.grade} • {days[session.dayOfWeek]} • {formatTime(session.time, timeFormat || '12h')}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
