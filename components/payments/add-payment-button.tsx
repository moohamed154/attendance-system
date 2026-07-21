'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPayment } from '@/actions/payments/payments';
import { toast } from 'sonner';

export function AddPaymentButton({ students, dict }: { students: { id: string; name: string; studentId: string }[], dict: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const studentId = formData.get('studentId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);
    const notes = formData.get('notes') as string || undefined;

    const result = await createPayment({ studentId, amount, month, year, notes });
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict.general?.success || 'Payment record created');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          {dict.paymentsPage.addPayment}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dict.paymentsPage.addPayment}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4" data-testid="payment-form">
          <div className="space-y-2">
            <Label htmlFor="studentId">{dict.paymentsPage.columns.student}</Label>
            <select 
              id="studentId" 
              name="studentId" 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{dict.modals?.selectStudent || 'Select a student...'}</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">{dict.paymentsPage.columns.amount} ({dict.paymentsPage.currency})</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required placeholder="50.00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">{dict.paymentsPage.columns.month}</Label>
              <Input id="month" name="month" type="number" min="1" max="12" required defaultValue={new Date().getMonth() + 1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">{dict.modals?.year || 'Year'}</Label>
              <Input id="year" name="year" type="number" required defaultValue={new Date().getFullYear()} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{dict.paymentsPage.columns.notes}</Label>
            <Input id="notes" name="notes" type="text" placeholder="Optional notes..." />
          </div>
          <Button type="submit" className="w-full rounded-xl mt-4" disabled={loading} data-testid="payment-save-button">
            {loading ? '...' : dict.paymentsPage.saveChanges}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
