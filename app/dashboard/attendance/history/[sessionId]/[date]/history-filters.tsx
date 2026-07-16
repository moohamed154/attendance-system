'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dayjs from 'dayjs';

export function HistoryFilters({
  dict,
  sessionId,
  currentDate,
  availableDates,
  currentQuery = '',
  currentStatus = 'ALL',
}: {
  dict: any;
  sessionId: string;
  currentDate: string;
  availableDates: string[];
  currentQuery?: string;
  currentStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentQuery);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dashboard/attendance/history/${sessionId}/${currentDate}?${createQueryString('q', query)}`);
  };

  const handleStatusChange = (value: string | null) => {
    if (!value) return;
    router.push(`/dashboard/attendance/history/${sessionId}/${currentDate}?${createQueryString('status', value === 'ALL' ? '' : value)}`);
  };

  const handleDateChange = (value: string | null) => {
    if (!value) return;
    // Preserve current query and status when navigating to a new date
    router.push(`/dashboard/attendance/history/${sessionId}/${value}?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <form onSubmit={handleSearch} className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={dict?.historyPage?.searchPlaceholder || 'Search students...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
      </form>
      
      <Select value={currentStatus || 'ALL'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
          <SelectValue placeholder={dict?.historyPage?.allStatuses || 'All Statuses'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{dict?.historyPage?.allStatuses || 'All Statuses'}</SelectItem>
          <SelectItem value="PRESENT">{dict?.historyPage?.status?.present || 'Present'}</SelectItem>
          <SelectItem value="ABSENT">{dict?.historyPage?.status?.absent || 'Absent'}</SelectItem>
          <SelectItem value="LATE">{dict?.historyPage?.status?.late || 'Late'}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentDate} onValueChange={handleDateChange}>
        <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-xl">
          <SelectValue placeholder="Select Date" />
        </SelectTrigger>
        <SelectContent>
          {availableDates.map(date => (
            <SelectItem key={date} value={date}>
              {dayjs(date).format('MMMM D, YYYY')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
