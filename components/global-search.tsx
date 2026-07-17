'use client';

import { useState, useEffect, useRef } from 'react';
import { useTransitionRouter } from '@/hooks/use-transition-router';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { Dictionary } from '@/lib/i18n';
import { logger } from '@/lib/logger';

interface StudentSearchResult {
  id: string;
  name: string;
  studentId: string;
  grade: string | null;
}

export function GlobalSearch({ dict }: { dict: Dictionary }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useTransitionRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json() as { students: StudentSearchResult[] };
        setResults(data.students || []);
        setIsOpen(true);
      } catch (error) {
        logger.error('Global search failed', 'GlobalSearch', { error: String(error) });
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [debouncedQuery]);

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={dict.nav?.search || "Search students..."}
          className="pl-9 pr-4 bg-background border-border"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query) setIsOpen(true);
          }}
        />
        {(loading || router.isPending) && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-popover text-popover-foreground rounded-md border shadow-md z-50 overflow-hidden">
          <ul className="max-h-[300px] overflow-auto py-1">
            {results.map((student) => (
              <li key={student.id}>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-muted focus:bg-muted outline-none transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                    router.push(`/dashboard/students/${student.id}`);
                  }}
                >
                  <div className="font-medium text-sm">{student.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{student.studentId}</span>
                    <span>•</span>
                    <span>{student.grade || 'No Grade'}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {isOpen && query && !loading && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-popover text-popover-foreground rounded-md border shadow-md z-50 p-4 text-center text-sm text-muted-foreground">
          No students found.
        </div>
      )}
    </div>
  );
}
