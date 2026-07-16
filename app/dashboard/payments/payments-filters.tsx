'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export function PaymentsFilters({ dict, currentQuery, currentStatus, currentMonth }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    updateFilters(debouncedSearch, currentStatus, currentMonth);
  }, [debouncedSearch]);

  const updateFilters = (query: string, status: string, month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (status && status !== 'all') params.set('status', status);
    else params.delete('status');
    
    if (month && month !== 'all') params.set('month', month);
    else params.delete('month');
    
    router.push(`/dashboard/payments?${params.toString()}`);
  };

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
        <Select value={currentStatus || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val, currentMonth)}>
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
        <Select value={currentMonth || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, currentStatus, val)}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.paymentsPage?.allMonths || "All Months"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.paymentsPage?.allMonths || "All Months"}</SelectItem>
            {Object.entries(dict.paymentsPage.months).map(([num, name]: [string, any]) => (
              <SelectItem key={num} value={num}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
