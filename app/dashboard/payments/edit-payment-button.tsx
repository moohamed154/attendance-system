'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updatePayment, deletePayment } from '@/actions/payments';
import { toast } from 'sonner';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface EditPaymentButtonProps {
  payment: {
    id: string;
    studentId: string;
    amount: number;
    month: number;
    year: number;
    status: 'PAID' | 'UNPAID' | 'PARTIAL';
    notes?: string | null;
    student: { name: string };
  };
  dict: any;
}

export function EditPaymentButton({ payment, dict }: EditPaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState(payment.amount.toString());
  const [month, setMonth] = useState(payment.month.toString());
  const [year, setYear] = useState(payment.year.toString());
  const [status, setStatus] = useState<'PAID'|'UNPAID'|'PARTIAL'>(payment.status);
  const [notes, setNotes] = useState(payment.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updatePayment(payment.id, {
      amount: parseFloat(amount),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      status,
      notes: notes || undefined,
    });
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict?.general?.success || 'Payment updated successfully');
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(dict.paymentsPage.confirmDelete)) return;
    
    setLoading(true);
    const result = await deletePayment(payment.id);
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict?.general?.success || 'Payment deleted successfully');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title={dict.paymentsPage.editPayment}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dict.paymentsPage.editPayment}</DialogTitle>
            <DialogDescription>
              {dict.paymentsPage.editPaymentDesc} - {payment.student.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-start">{dict.paymentsPage.columns.amount}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="month" className="text-start">{dict.paymentsPage.columns.month}</Label>
              <Select value={month} onValueChange={(v) => setMonth(v ?? month)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={dict.paymentsPage.columns.month}>
                    {(dict.paymentsPage.months as any)[month] as string}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dict.paymentsPage.months).map(([num, name]) => (
                    <SelectItem key={num} value={num.toString()}>
                      {name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-start">{dict.paymentsPage.columns.status}</Label>
              <Select value={status} onValueChange={(val) => setStatus((val ?? status) as 'PAID'|'UNPAID'|'PARTIAL')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={dict.paymentsPage.columns.status}>
                    {status === 'PAID' ? dict.paymentsPage.status.paid : dict.paymentsPage.status.unpaid}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">{dict.paymentsPage.status.paid}</SelectItem>
                  <SelectItem value="UNPAID">{dict.paymentsPage.status.unpaid}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-start">{dict.paymentsPage.columns.notes}</Label>
              <Input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between flex-row-reverse sm:flex-row mt-6">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
              className="mr-auto"
            >
              {dict.paymentsPage.deletePayment}
            </Button>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.paymentsPage.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '...' : dict.paymentsPage.saveChanges}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
