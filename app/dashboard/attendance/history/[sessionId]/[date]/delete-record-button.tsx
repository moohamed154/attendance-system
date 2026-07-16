'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { softDeleteAttendance } from '@/actions/attendance';
import { toast } from 'sonner';

export function DeleteRecordButton({ attendanceId, dict }: { attendanceId: string, dict: any }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await softDeleteAttendance(attendanceId);
    setIsLoading(false);
    
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(dict.historyPage.recordDeleted);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.historyPage.deleteRecord}</DialogTitle>
          <DialogDescription>
            {dict.historyPage.confirmDelete}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            {dict.usersPage.cancel}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? '...' : dict.historyPage.deleteRecord}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
