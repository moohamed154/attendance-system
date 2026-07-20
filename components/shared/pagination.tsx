'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useTransitionRouter } from '@/hooks/use-transition-router';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from 'lucide-react';

export function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useTransitionRouter();

  const currentPage = Number(searchParams.get('page')) || 1;

  if (totalPages <= 1 && !router.isPending) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page));
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePageChange(i)}
            className="w-8 h-8 p-0"
          >
            {i}
          </Button>
        );
      }
    } else {
      // Logic for ellipsis
      pages.push(
        <Button
          key={1}
          variant={currentPage === 1 ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(1)}
          className="w-8 h-8 p-0"
        >
          1
        </Button>
      );

      if (currentPage > 3) {
        pages.push(
          <div key="ellipsis-1" className="flex items-end justify-center w-8 h-8 text-muted-foreground pb-1">
            <MoreHorizontal className="w-4 h-4" />
          </div>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePageChange(i)}
            className="w-8 h-8 p-0"
          >
            {i}
          </Button>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(
          <div key="ellipsis-2" className="flex items-end justify-center w-8 h-8 text-muted-foreground pb-1">
            <MoreHorizontal className="w-4 h-4" />
          </div>
        );
      }

      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          className="w-8 h-8 p-0"
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4 relative">
      <Button
        variant="outline"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1 || router.isPending}
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
      </Button>
      {renderPageNumbers()}
      <Button
        variant="outline"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || router.isPending}
      >
        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
      </Button>
      {router.isPending && (
        <div className="absolute right-0 translate-x-full pl-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
