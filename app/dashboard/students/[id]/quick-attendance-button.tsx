'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { markAttendance } from '@/actions/attendance';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function QuickAttendanceButton({ student, session, dict }: { student: any, session: any, dict?: any }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = dict?.modals || {};

  const handleMark = async (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (!session) {
      toast.error(t.noSessionAssigned || 'Student is not assigned to any session.');
      return;
    }
    
    setIsLoading(true);
    const res = await markAttendance(student.id, session.id, status);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(dict.general?.success || `Marked as ${status}`);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <ClipboardList className="w-4 h-4 rtl:ml-2 ltr:mr-2" />
          {dict?.studentProfile?.recordAttendance || "Record Today's Attendance"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict?.studentProfile?.recordAttendanceTitle || "Today's Attendance"}</DialogTitle>
          <DialogDescription>
            {dict?.studentProfile?.recordAttendanceDesc || "Quickly mark attendance for"} {student.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button 
            variant="outline" 
            className="h-14 justify-start border-green-200 hover:bg-green-50 dark:hover:bg-green-950"
            onClick={() => handleMark('PRESENT')}
            disabled={isLoading}
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 rtl:ml-3 ltr:mr-3" />
            <span className="text-lg">{dict?.general?.status?.PRESENT || 'Present'}</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-14 justify-start border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => handleMark('ABSENT')}
            disabled={isLoading}
          >
            <XCircle className="w-5 h-5 text-red-500 rtl:ml-3 ltr:mr-3" />
            <span className="text-lg">{dict?.general?.status?.ABSENT || 'Absent'}</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-14 justify-start border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950"
            onClick={() => handleMark('LATE')}
            disabled={isLoading}
          >
            <Clock className="w-5 h-5 text-amber-500 rtl:ml-3 ltr:mr-3" />
            <span className="text-lg">{dict?.general?.status?.LATE || 'Late'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
