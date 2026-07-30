'use client';

import { StudentPaymentStatus } from '@/lib/payments/payment-status';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle2, FileText, StickyNote, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentStatusBadgeProps {
  paymentStatus?: StudentPaymentStatus | {
    remaining: number | null;
    isPaid: boolean;
    status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'NO_SUBSCRIPTION';
    notes?: string | null;
    hasNotes?: boolean;
  } | null;
  currencySymbol?: string;
  dict?: any;
  className?: string;
}

export function PaymentStatusBadge({
  paymentStatus,
  currencySymbol = 'EGP',
  dict,
  className,
}: PaymentStatusBadgeProps) {
  const status = paymentStatus?.status || 'NO_SUBSCRIPTION';
  const remaining = paymentStatus?.remaining ?? null;
  const isPaid = paymentStatus?.isPaid ?? false;
  const notes = paymentStatus?.notes || null;
  const hasNotes = !!(notes && notes.trim().length > 0);

  const paidText = dict?.paymentsPage?.status?.paid || 'Paid';
  const remainingLabel = dict?.paymentsPage?.remaining || 'Remaining';
  const noSubscriptionText = dict?.paymentsPage?.noSubscription || 'No Subscription';
  const notesTitle = dict?.paymentsPage?.subscriptionNotes || 'Subscription Notes';
  const hasNotesLabel = dict?.paymentsPage?.hasNotes || 'Notes';

  return (
    <div className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}>
      {/* 1. Primary Payment Status Badge */}
      {status === 'NO_SUBSCRIPTION' || remaining === null ? (
        <span
          data-testid="badge-no-subscription"
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
          title="No subscription generated for this month yet"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{noSubscriptionText}</span>
        </span>
      ) : isPaid || remaining === 0 ? (
        <span
          data-testid="badge-paid"
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-2xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          <span>✅ {paidText}</span>
        </span>
      ) : (
        <span
          data-testid="badge-remaining"
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs"
        >
          <span>{remainingLabel}: {remaining} {currencySymbol}</span>
        </span>
      )}

      {/* 2. Subscription Notes Icon Badge */}
      {hasNotes && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid="badge-notes-icon"
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
              title={notesTitle}
            >
              <StickyNote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{hasNotesLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-72 p-3 shadow-md rounded-xl bg-popover border border-border">
            <div className="flex items-center gap-2 border-b pb-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-xs text-foreground">{notesTitle}</h4>
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {notes}
            </p>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
