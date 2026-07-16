'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export function SessionsFilters({ dict, currentQuery, currentGrade, currentDay }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    updateFilters(debouncedSearch, currentGrade, currentDay);
  }, [debouncedSearch]);

  const updateFilters = (query: string, grade: string, day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (grade && grade !== 'all') params.set('grade', grade);
    else params.delete('grade');
    
    if (day && day !== 'all') params.set('day', day);
    else params.delete('day');
    
    router.push(`/dashboard/sessions?${params.toString()}`);
  };

  const DAYS = [
    { value: '0', label: dict.sessionsPage.days.sunTueThu },
    { value: '1', label: dict.sessionsPage.days.satMonWed },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder={dict.sessionsPage?.searchPlaceholder || "Search by time (e.g., 10:00 AM)"}
          className="ltr:pl-9 rtl:pr-9 h-11 rounded-xl bg-card border-border/50 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 sm:max-w-[200px]">
        <Select value={currentGrade || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val, currentDay)}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.studentsPage?.allGrades || "All Grades"}>
              {currentGrade && currentGrade !== 'all' 
                ? (dict.grades[`grade${currentGrade}`] || currentGrade)
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
        <Select value={currentDay || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, currentGrade, val)}>
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
