'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Dictionary } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';
import { formatTime } from '@/lib/utils';

interface StudentsFiltersProps {
  dict: Dictionary;
  sessions: any[];
  currentQuery: string;
  currentGrade: string;
  currentSessionId: string;
  timeFormat?: string;
}

export function StudentsFilters({ dict, sessions, currentQuery, currentGrade, currentSessionId, timeFormat }: StudentsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  const updateFilters = useCallback((query: any, grade: any, sessionId: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (grade && grade !== 'all') params.set('grade', grade);
    else params.delete('grade');
    
    if (sessionId && sessionId !== 'all') params.set('sessionId', sessionId);
    else params.delete('sessionId');
    
    router.push(`/dashboard/students?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    updateFilters(debouncedSearch, currentGrade || '', currentSessionId || '');
  }, [debouncedSearch, currentGrade, currentSessionId, updateFilters]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder={dict.studentsPage?.searchPlaceholder || "Search students..."}
          className="ltr:pl-9 rtl:pr-9 h-11 rounded-xl bg-card border-border/50 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 sm:max-w-[200px]">
        <Select value={currentGrade || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val, currentSessionId || '')}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.studentsPage?.allGrades || "All Grades"}>
              {currentGrade && currentGrade !== 'all' 
                ? (dict.grades as any)[`grade${currentGrade}`]
                : (dict.studentsPage?.allGrades || "All Grades")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.studentsPage?.allGrades || "All Grades"}</SelectItem>
            <SelectItem value="1">{(dict.grades as any).grade1}</SelectItem>
            <SelectItem value="2">{(dict.grades as any).grade2}</SelectItem>
            <SelectItem value="3">{(dict.grades as any).grade3}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 sm:max-w-[250px]">
        <Select value={currentSessionId || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, currentGrade || '', val)}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.studentsPage?.allSessions || "All Sessions"}>
              {currentSessionId && currentSessionId !== 'all' && currentSessionId !== 'none' && sessions.find((s: any) => s.id === currentSessionId)
                ? (() => {
                    const s = sessions.find((s: any) => s.id === currentSessionId);
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const gradeKey = 'grade' + s.grade;
                    return `${(dict.grades as any)[gradeKey] || s.grade} • ${days[s.dayOfWeek]} • ${formatTime(s.time, timeFormat || '12h')}`;
                  })()
                : currentSessionId === 'none' 
                  ? (dict.studentsPage?.noSession || "No Session")
                  : (dict.studentsPage?.allSessions || "All Sessions")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.studentsPage?.allSessions || "All Sessions"}</SelectItem>
            <SelectItem value="none">{dict.studentsPage?.noSession || "No Session"}</SelectItem>
            {sessions.map((session: any) => {
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              return (
                <SelectItem key={session.id} value={session.id}>
                  {(dict.grades as any)[`grade${session.grade}`] || session.grade} • {days[session.dayOfWeek]} • {formatTime(session.time, timeFormat || '12h')}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
