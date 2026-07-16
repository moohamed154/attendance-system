'use client';

import { useTransition } from 'react';
import { updatePaymentStatus } from '@/actions/payments';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { PaymentStatus } from '@prisma/client';
import { toast } from 'sonner';

export function PaymentStatusToggle({ id, currentStatus, dict }: { id: string, currentStatus: PaymentStatus, dict: any }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
      const result = await updatePaymentStatus(id, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(newStatus === 'PAID' ? dict.paymentsPage.status.paid : dict.paymentsPage.status.unpaid);
      }
    });
  };

  return (
    <Button 
      variant={currentStatus === 'PAID' ? 'outline' : 'default'}
      size="sm"
      className="rounded-lg w-28 transition-all"
      onClick={handleToggle}
      disabled={isPending}
    >
      {currentStatus === 'PAID' ? (
        <>
          <X className="w-4 h-4 mr-1 ml-1" /> {dict.paymentsPage.unmark || 'Unmark'}
        </>
      ) : (
        <>
          <Check className="w-4 h-4 mr-1 ml-1" /> {dict.paymentsPage.markPaid || 'Mark Paid'}
        </>
      )}
    </Button>
  );
}
