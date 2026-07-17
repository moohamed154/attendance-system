'use client';

import { useTransitionRouter } from '@/hooks/use-transition-router';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  isArabic?: boolean;
}

export function SimplePagination({ currentPage, totalPages, isArabic }: SimplePaginationProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6 pb-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1 || router.isPending}
      >
        {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
      <div className="text-sm font-medium text-muted-foreground mx-4">
        {isArabic ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || router.isPending}
      >
        {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}
