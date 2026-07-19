'use client';

import { useSearchParams } from 'next/navigation';
import { useTransitionRouter } from '@/hooks/use-transition-router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Dictionary } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';

interface UsersFiltersProps {
  dict: Dictionary;
  currentQuery: string;
  currentRole: string;
}

export function UsersFilters({ dict, currentQuery, currentRole }: UsersFiltersProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(currentQuery || '');
  const debouncedSearch = useDebounce(search, 300);

  const updateFilters = useCallback((query: any, role: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (role && role !== 'all') params.set('role', role);
    else params.delete('role');
    
    router.push(`/dashboard/users?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlRole = searchParams.get('role') || '';

    const newQuery = debouncedSearch || '';
    const newRole = (currentRole && currentRole !== 'all') ? currentRole : '';

    if (newQuery !== urlQuery || newRole !== urlRole) {
      updateFilters(debouncedSearch, currentRole || '');
    }
  }, [debouncedSearch, currentRole, searchParams, updateFilters]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        {router.isPending ? (
          <Loader2 className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input 
          placeholder={dict.usersPage?.searchPlaceholder || "Search users..."}
          className="ltr:pl-9 rtl:pr-9 h-11 rounded-xl bg-card border-border/50 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 sm:max-w-[200px]">
        <Select value={currentRole || 'all'} onValueChange={(val) => updateFilters(debouncedSearch, val)} disabled={router.isPending}>
          <SelectTrigger className="h-11 rounded-xl bg-card border-border/50 shadow-sm">
            <SelectValue placeholder={dict.usersPage?.allRoles || "All Roles"}>
              {currentRole && currentRole !== 'all' 
                ? (currentRole === 'ADMIN' ? dict.usersPage.roles.admin : dict.usersPage.roles.assistant)
                : (dict.usersPage?.allRoles || "All Roles")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.usersPage?.allRoles || "All Roles"}</SelectItem>
            <SelectItem value="ADMIN">{dict.usersPage.roles.admin}</SelectItem>
            <SelectItem value="ASSISTANT">{dict.usersPage.roles.assistant}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
