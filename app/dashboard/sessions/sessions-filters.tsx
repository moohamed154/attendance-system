'use client';

import { useSearchParams } from 'next/navigation';
import { useTransitionRouter } from '@/hooks/use-transition-router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Dictionary } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';

interface SessionsFiltersProps {
  dict: Dictionary;
  currentQuery: string;
  currentGrade: string;
  currentDay: string;
}

export function SessionsFilters({ dict, currentQuery, currentGrade, currentDay }: SessionsFiltersProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  const DAYS = [
    { value: '0', label: dict.sessionsPage.days.sunTueThu },
    { value: '1', label: dict.sessionsPage.days.satMonWed },
  ];

  const updateFilters = useCallback((query: any, grade: any, day: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (grade && grade !== 'all') params.set('grade', grade);
    else params.delete('grade');
    
    if (day && day !== 'all') params.set('day', day);
    else params.delete('day');
    
    router.push(`/dashboard/sessions?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlGrade = searchParams.get('grade') || '';
    const urlDay = searchParams.get('day') || '';

    const newQuery = debouncedSearch || '';
    const newGrade = (currentGrade && currentGrade !== 'all') ? currentGrade : '';
    const newDay = (currentDay && currentDay !== 'all') ? currentDay : '';

    if (newQuery !== urlQuery || newGrade !== urlGrade || newDay !== urlDay) {
      updateFilters(debouncedSearch, currentGrade || '', currentDay || '');
    }
  }, [debouncedSearch, currentGrade, currentDay, searchParams, updateFilters]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        {router.isPending ? (
          <Loader2 className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input 
          placeholder={dict.sessionsPage?.searchPlaceholder || "Search by time (e.g., 10:00 AM)"}
          className="ltr:pl-9 rtl:pr-9 h-11 rounded-xl bg-card border-border/50 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 sm:max-w-[200px]">
        <Select value={currentGrade || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val, currentDay || '')} disabled={router.isPending}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.studentsPage?.allGrades || "All Grades"}>
              {currentGrade && currentGrade !== 'all' 
                ? (dict.grades as any)[`grade${currentGrade}`]
                : (dict.studentsPage?.allGrades || "All Grades")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.studentsPage?.allGrades || "All Grades"}</SelectItem>
            <SelectItem value="1">{dict.grades.grade1}</SelectItem>
            <SelectItem value="2">{dict.grades.grade2}</SelectItem>
            <SelectItem value="3">{dict.grades.grade3}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 sm:max-w-[250px]">
        <Select value={currentDay || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, currentGrade || '', val)} disabled={router.isPending}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.sessionsPage?.allDays || "All Days"}>
              {currentDay && currentDay !== 'all' 
                ? (DAYS.find(d => d.value === currentDay)?.label || currentDay)
                : (dict.sessionsPage?.allDays || "All Days")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.sessionsPage?.allDays || "All Days"}</SelectItem>
            {DAYS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
