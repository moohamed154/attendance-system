'use client';

import { useSearchParams } from 'next/navigation';
import { useTransitionRouter } from '@/hooks/use-transition-router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTime } from '@/lib/utils';

export function HistoryMainFilters({ 
  dict, 
  sessions, 
  currentQuery, 
  currentGrade, 
  currentSessionId, 
  currentDate, 
  currentStatus,
  viewMode 
}: any) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  const updateFilters = useCallback((
    query: string, 
    grade: string, 
    sessionId: string, 
    date: string, 
    status: string, 
    view: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (grade && grade !== 'all') params.set('grade', grade);
    else params.delete('grade');
    
    if (sessionId && sessionId !== 'all' && sessionId !== 'none') params.set('session', sessionId);
    else params.delete('session');
    
    if (date && date !== 'all') params.set('date', date);
    else params.delete('date');

    if (status && status !== 'ALL') params.set('status', status);
    else params.delete('status');

    if (view && view !== 'sessions') params.set('view', view);
    else params.delete('view');
    
    router.push(`/dashboard/attendance/history?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    updateFilters(debouncedSearch, currentGrade || '', currentSessionId || '', currentDate || '', currentStatus || '', viewMode || 'sessions');
  }, [debouncedSearch, currentGrade, currentSessionId, currentDate, currentStatus, viewMode, updateFilters]);

  return (
    <div className="space-y-4 mb-6">
      <Tabs value={viewMode || 'sessions'} onValueChange={(val) => updateFilters(debouncedSearch, currentGrade || '', currentSessionId || '', currentDate || '', currentStatus || '', val)}>
        <TabsList className="bg-card border-border/50 shadow-sm rounded-xl p-1 relative">
          <TabsTrigger value="sessions" className="rounded-lg px-4" disabled={router.isPending}>{dict.historyPage?.tabs?.sessions || "Sessions View"}</TabsTrigger>
          <TabsTrigger value="records" className="rounded-lg px-4" disabled={router.isPending}>{dict.historyPage?.tabs?.records || "Records View"}</TabsTrigger>
          {router.isPending && <div className="absolute right-[-24px]"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>}
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4">
        {viewMode === 'records' && (
          <div className="relative flex-1">
            {router.isPending ? (
              <Loader2 className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <Input 
              placeholder={dict.historyPage?.searchPlaceholder || "Search students..."}
              className="ltr:pl-9 rtl:pr-9 h-11 rounded-xl bg-card border-border/50 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="flex-1 sm:max-w-[200px]">
          <Input 
            type="date"
            value={currentDate || ''}
            onChange={(e) => updateFilters(debouncedSearch, currentGrade || '', currentSessionId || '', e.target.value, currentStatus || '', viewMode || 'sessions')}
            className="h-11 rounded-xl bg-card border-border/50 shadow-sm"
            placeholder={dict.historyPage?.allDates || "All Dates"}
            disabled={router.isPending}
          />
        </div>

        <div className="flex-1 sm:max-w-[150px]">
          <Select value={currentGrade || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val, currentSessionId || '', currentDate || '', currentStatus || '', viewMode || 'sessions')} disabled={router.isPending}>
            <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
              <SelectValue placeholder={dict.historyPage?.allGrades || "All Grades"}>
                {currentGrade && currentGrade !== 'all' 
                  ? (dict.grades as any)[`grade${currentGrade}`]
                  : (dict.historyPage?.allGrades || "All Grades")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.historyPage?.allGrades || "All Grades"}</SelectItem>
              <SelectItem value="1">{(dict.grades as any).grade1}</SelectItem>
              <SelectItem value="2">{(dict.grades as any).grade2}</SelectItem>
              <SelectItem value="3">{(dict.grades as any).grade3}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 sm:max-w-[200px]">
          <Select value={currentSessionId || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, currentGrade || '', val, currentDate || '', currentStatus || '', viewMode || 'sessions')} disabled={router.isPending}>
            <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
              <SelectValue placeholder={dict.historyPage?.allSessions || "All Sessions"}>
                {currentSessionId && currentSessionId !== 'all' && currentSessionId !== 'none' && sessions.find((s: any) => s.id === currentSessionId)
                  ? (() => {
                      const s = sessions.find((s: any) => s.id === currentSessionId);
                      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      const gradeKey = 'grade' + s.grade;
                      return `${(dict.grades as any)[gradeKey] || s.grade} • ${days[s.dayOfWeek]} • ${formatTime(s.time, '12h')}`;
                    })()
                  : currentSessionId === 'none' 
                    ? (dict.studentsPage?.noSession || "No Session")
                    : (dict.historyPage?.allSessions || "All Sessions")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.historyPage?.allSessions || "All Sessions"}</SelectItem>
              {sessions.map((session: any) => {
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                return (
                  <SelectItem key={session.id} value={session.id}>
                    {(dict.grades as any)[`grade${session.grade}`] || session.grade} • {days[session.dayOfWeek]} • {formatTime(session.time, '12h')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {viewMode === 'records' && (
          <div className="flex-1 sm:max-w-[150px]">
            <Select value={currentStatus || 'ALL'} onValueChange={(val) => updateFilters(debouncedSearch, currentGrade || '', currentSessionId || '', currentDate || '', val, viewMode || 'sessions')} disabled={router.isPending}>
              <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
                <SelectValue placeholder={dict.historyPage?.allStatuses || "All Statuses"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{dict.historyPage?.allStatuses || "All Statuses"}</SelectItem>
                <SelectItem value="PRESENT">{dict.historyPage?.status?.present || "Present"}</SelectItem>
                <SelectItem value="ABSENT">{dict.historyPage?.status?.absent || "Absent"}</SelectItem>
                <SelectItem value="LATE">{dict.historyPage?.status?.late || "Late"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
