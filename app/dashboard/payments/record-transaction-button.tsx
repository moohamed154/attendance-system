'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { recordTransaction } from '@/actions/payments';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';

export function RecordTransactionButton({ payment, currencySymbol }: { payment: any; currencySymbol: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const remaining = payment.amount - (payment.amountPaid || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setLoading(true);
    const result = await recordTransaction({ paymentId: payment.id, amount: Number(amount) });
    if (result.success) {
      toast.success('Transaction Recorded', {
        description: `Successfully recorded ${amount} ${currencySymbol}.`,
      });
      setOpen(false);
      setAmount('');
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to record transaction',
      });
    }
    setLoading(false);
  };

  if (payment.status === 'PAID') {
    return (
      <Button variant="outline" size="sm" disabled className="opacity-50">
        Paid
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-white">
          <PlusCircle className="w-4 h-4 mr-1" />
          Pay
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a partial or full payment for {payment.student.name} for the month of {dayjs().month(payment.month - 1).format('MMMM')} {payment.year}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
            <div>
              <p className="text-sm text-muted-foreground">Total Fee</p>
              <p className="font-semibold">{payment.amount} {currencySymbol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Already Paid</p>
              <p className="font-semibold text-green-600">{payment.amountPaid || 0} {currencySymbol}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-semibold text-destructive">{remaining} {currencySymbol}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Pay Now</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`e.g. ${remaining}`}
                required
              />
              <Button type="button" variant="outline" onClick={() => setAmount(remaining.toString())}>
                Max
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
