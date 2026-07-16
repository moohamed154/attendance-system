'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export function ActivityFilters({ dict, currentQuery, currentRole }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    updateFilters(debouncedSearch, currentRole);
  }, [debouncedSearch]);

  const updateFilters = (query: string, role: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (role && role !== 'all') params.set('role', role);
    else params.delete('role');
    
    router.push(`/dashboard/activity?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder={dict.activityPage?.searchPlaceholder || "Search by action, user or target..."}
          className="ltr:pl-9 rtl:pr-9 h-11 rounded-xl bg-card border-border/50 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 sm:max-w-[200px]">
        <Select value={currentRole || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val)}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.activityPage?.allRoles || "All Roles"}>
              {currentRole && currentRole !== 'all' 
                ? (currentRole === 'ADMIN' ? 'Admin' : 'Assistant')
                : (dict.activityPage?.allRoles || "All Roles")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.activityPage?.allRoles || "All Roles"}</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="ASSISTANT">Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
