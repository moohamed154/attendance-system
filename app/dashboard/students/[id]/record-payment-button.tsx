'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { createPayment } from '@/actions/payments';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RecordPaymentButton({ student }: { student: any }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentDate = new Date();
  const [amount, setAmount] = useState(student.monthlyFee || '');
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const res = await createPayment({
      studentId: student.id,
      amount: Number(amount),
      month: Number(month),
      year: Number(year),
    });

    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Payment recorded successfully');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Wallet className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment for {student.name}</DialogTitle>
          <DialogDescription>
            Add a new payment record for this student.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input 
              type="number" 
              required 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input 
                type="number" 
                min={1} 
                max={12} 
                required 
                value={month} 
                onChange={e => setMonth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input 
                type="number" 
                required 
                value={year} 
                onChange={e => setYear(Number(e.target.value))}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Record Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
