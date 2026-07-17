'use client';

import { useSearchParams } from 'next/navigation';
import { useTransitionRouter } from '@/hooks/use-transition-router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Dictionary } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';

interface PaymentsFiltersProps {
  dict: Dictionary;
  currentQuery: string;
  currentStatus: string;
  currentMonth: string;
}

export function PaymentsFilters({ dict, currentQuery, currentStatus, currentMonth }: PaymentsFiltersProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  const updateFilters = useCallback((query: any, status: any, month: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (status && status !== 'all') params.set('status', status);
    else params.delete('status');
    
    if (month && month !== 'all') params.set('month', month);
    else params.delete('month');
    
    router.push(`/dashboard/payments?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    updateFilters(debouncedSearch, currentStatus || '', currentMonth || '');
  }, [debouncedSearch, currentStatus, currentMonth, updateFilters]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        {router.isPending ? (
          <Loader2 className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input 
          placeholder={dict.studentsPage?.searchPlaceholder || "Search students..."}
          className="ltr:pl-9 rtl:pr-9 h-11 rounded-xl bg-card border-border/50 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 sm:max-w-[200px]">
        <Select value={currentStatus || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val, currentMonth || '')} disabled={router.isPending}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.paymentsPage?.allStatuses || "All Statuses"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.paymentsPage?.allStatuses || "All Statuses"}</SelectItem>
            <SelectItem value="PAID">{dict.paymentsPage.status.paid}</SelectItem>
            <SelectItem value="UNPAID">{dict.paymentsPage.status.unpaid}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 sm:max-w-[250px]">
        <Select value={currentMonth || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, currentStatus || '', val)} disabled={router.isPending}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.paymentsPage?.allMonths || "All Months"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.paymentsPage?.allMonths || "All Months"}</SelectItem>
            {Object.entries(dict.paymentsPage.months).map(([num, name]) => (
              <SelectItem key={num} value={num}>
                {name as string}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
