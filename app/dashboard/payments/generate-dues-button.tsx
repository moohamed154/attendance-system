'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { generateMonthlyDues } from '@/actions/payments';
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

export function GenerateDuesButton({ dict }: { dict: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const handleGenerate = async () => {
    setLoading(true);
    const res = await generateMonthlyDues(month, year);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Generated ${res.created} records. ${res.skipped} students already had records for this month.`);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarPlus className="w-4 h-4" />
          Generate Monthly Dues
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Monthly Dues</DialogTitle>
          <DialogDescription>
            This will create UNPAID payment records for all active students who don't already have a record for the selected month and year.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Month</Label>
            <Input type="number" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? 'Generating...' : `Generate Dues for ${month}/${year}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
