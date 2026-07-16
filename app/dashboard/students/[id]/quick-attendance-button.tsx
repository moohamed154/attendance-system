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

export function QuickAttendanceButton({ student, session }: { student: any, session: any }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMark = async (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (!session) {
      toast.error('Student is not assigned to any session.');
      return;
    }
    
    setIsLoading(true);
    const res = await markAttendance(student.id, session.id, status);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Marked as ${status}`);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <ClipboardList className="w-4 h-4 mr-2" />
          Record Today's Attendance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Today's Attendance</DialogTitle>
          <DialogDescription>
            Record attendance for {student.name} for today's session.
          </DialogDescription>
        </DialogHeader>
        {!session ? (
          <div className="text-center p-4 text-muted-foreground">
            This student must be assigned to a session before taking attendance.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:bg-green-500 hover:text-white"
              onClick={() => handleMark('PRESENT')}
              disabled={isLoading}
            >
              <CheckCircle2 className="w-8 h-8" />
              Present
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:bg-red-500 hover:text-white"
              onClick={() => handleMark('ABSENT')}
              disabled={isLoading}
            >
              <XCircle className="w-8 h-8" />
              Absent
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:bg-yellow-500 hover:text-white"
              onClick={() => handleMark('LATE')}
              disabled={isLoading}
            >
              <Clock className="w-8 h-8" />
              Late
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
