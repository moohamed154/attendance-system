'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, RefreshCcw, FolderOpen, Loader2 } from 'lucide-react';
import { retryFailedGeneration, reopenMonthlyGeneration } from '@/actions/subscriptions';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/components/dictionary-provider';

export function GenerationsActions({ snapshot }: { snapshot: any }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const { toast } = useToast();
  const dict = useDictionary();
  const t = dict.generationHistoryPage || {};

  const handleRetry = async () => {
    setIsRetrying(true);
    const res = await retryFailedGeneration(snapshot.id);
    if (res.error) {
      toast({ title: dict.general?.error || 'Error', description: res.error, variant: 'destructive' });
    } else {
      toast({ 
        title: t.retryComplete || 'Retry Complete', 
        description: (t.retryCompleteDesc || 'Successfully created {count} subscriptions. {remaining} still failing.')
          .replace('{count}', res.count || 0)
          .replace('{remaining}', res.remainingFailed || 0)
      });
    }
    setIsRetrying(false);
  };

  const handleReopen = async () => {
    setIsReopening(true);
    const res = await reopenMonthlyGeneration(snapshot.id);
    if (res.error) {
      toast({ title: dict.general?.error || 'Error', description: res.error, variant: 'destructive' });
    } else {
      toast({ 
        title: t.reopenComplete || 'Reopen Complete', 
        description: (t.reopenCompleteDesc || 'Generated {count} new subscriptions for recently added students.')
          .replace('{count}', res.count || 0)
      });
    }
    setIsReopening(false);
  };

  const isLoading = isRetrying || isReopening;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          <span className="sr-only">{dict.general?.actions || 'Open menu'}</span>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {snapshot.failedCount > 0 && (
          <DropdownMenuItem onClick={handleRetry} disabled={isLoading} className="cursor-pointer">
            <RefreshCcw className="w-4 h-4 rtl:ml-2 ltr:mr-2 text-red-500" /> {t.retryFailed || 'Retry Failed Records'}
          </DropdownMenuItem>
        )}
        {snapshot.status.startsWith('COMPLETED') && (
          <DropdownMenuItem onClick={handleReopen} disabled={isLoading} className="cursor-pointer">
            <FolderOpen className="w-4 h-4 rtl:ml-2 ltr:mr-2 text-blue-500" /> {t.reopenMonth || 'Reopen Month'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
