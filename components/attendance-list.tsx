'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { markAttendance } from '@/actions/attendance';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useDictionary } from '@/components/dictionary-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { toast } from 'sonner';

type StudentItem = {
  id: string;
  studentId: string;
  name: string;
  status: AttendanceStatus | null;
  paymentStatus?: string;
};

export function AttendanceList({ 
  sessionId, 
  initialStudents,
  targetDate
}: { 
  sessionId: string;
  initialStudents: StudentItem[];
  targetDate?: Date;
}) {
  const dict = useDictionary();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  const [_isPending, startTransition] = useTransition();
  const [optimisticStudents, addOptimisticStudent] = useOptimistic(
    initialStudents,
    (state, newStatus: { id: string; status: AttendanceStatus }) => 
      state.map(s => s.id === newStatus.id ? { ...s, status: newStatus.status } : s)
  );

  const filteredStudents = optimisticStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.studentId.toLowerCase().includes(search.toLowerCase());
                          
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'UNMARKED') {
        matchesStatus = s.status === null;
      } else {
        matchesStatus = s.status === statusFilter;
      }
    }
    
    let matchesPayment = true;
    if (paymentFilter !== 'all') {
      matchesPayment = s.paymentStatus === paymentFilter;
    }
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    startTransition(async () => {
      addOptimisticStudent({ id: studentId, status });
      const res = await markAttendance(studentId, sessionId, status, targetDate);
      if (res?.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 p-4 border-b bg-background flex flex-col sm:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={dict.attendance.search} 
            className="ltr:pl-9 rtl:pr-9 h-12 sm:h-11 rounded-xl bg-background border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex-1 sm:max-w-[180px]">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="h-12 sm:h-11 rounded-xl bg-background border-border/50 shadow-sm">
              <SelectValue placeholder={dict.attendance.allStatuses || "All Statuses"}>
                {statusFilter === 'all' ? (dict.attendance.allStatuses || "All Statuses") :
                 statusFilter === 'PRESENT' ? dict.attendance.present :
                 statusFilter === 'ABSENT' ? dict.attendance.absent :
                 statusFilter === 'LATE' ? dict.attendance.late :
                 dict.attendance.unmarked || "Unmarked"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.attendance.allStatuses || "All Statuses"}</SelectItem>
              <SelectItem value="PRESENT">{dict.attendance.present}</SelectItem>
              <SelectItem value="ABSENT">{dict.attendance.absent}</SelectItem>
              <SelectItem value="LATE">{dict.attendance.late}</SelectItem>
              <SelectItem value="UNMARKED">{dict.attendance.unmarked || "Unmarked"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 sm:max-w-[180px]">
          <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v ?? 'all')}>
            <SelectTrigger className="h-12 sm:h-11 rounded-xl bg-background border-border/50 shadow-sm">
              <SelectValue placeholder={dict.paymentsPage?.allStatuses || "All Payments"}>
                {paymentFilter === 'all' ? (dict.paymentsPage?.allStatuses || "All Payments") :
                 paymentFilter === 'PAID' ? (dict.paymentsPage?.status?.paid || "Paid") :
                 (dict.paymentsPage?.status?.unpaid || "Unpaid")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.paymentsPage?.allStatuses || "All Payments"}</SelectItem>
              <SelectItem value="PAID">{dict.paymentsPage?.status?.paid || "Paid"}</SelectItem>
              <SelectItem value="UNPAID">{dict.paymentsPage?.status?.unpaid || "Unpaid"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {dict.attendance.noStudents}
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-muted/10">
              <div className="flex items-center gap-3">
                <div>
                  <Link href={`/dashboard/students/${student.id}`} className="font-medium text-lg hover:underline decoration-primary underline-offset-4">{student.name}</Link>
                  <div className="text-sm text-muted-foreground font-mono">{student.studentId}</div>
                </div>
                {student.paymentStatus === 'PAID' ? (
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                    {dict.paymentsPage?.status?.paid || 'Paid'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                    {dict.paymentsPage?.status?.unpaid || 'Unpaid'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant={student.status === 'PRESENT' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    "flex-1 sm:flex-none h-14 sm:h-11 rounded-xl font-medium transition-all",
                    student.status === 'PRESENT' && "bg-green-500 hover:bg-green-600 text-white border-green-500"
                  )}
                  onClick={() => handleMark(student.id, 'PRESENT')}
                >
                  <CheckCircle2 className={cn("w-5 h-5 ltr:mr-2 rtl:ml-2", student.status !== 'PRESENT' && "text-green-500")} />
                  {dict.attendance.present}
                </Button>
                
                <Button
                  variant={student.status === 'ABSENT' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    "flex-1 sm:flex-none h-14 sm:h-11 rounded-xl font-medium transition-all",
                    student.status === 'ABSENT' && "bg-red-500 hover:bg-red-600 text-white border-red-500"
                  )}
                  onClick={() => handleMark(student.id, 'ABSENT')}
                >
                  <XCircle className={cn("w-5 h-5 ltr:mr-2 rtl:ml-2", student.status !== 'ABSENT' && "text-red-500")} />
                  {dict.attendance.absent}
                </Button>
                
                <Button
                  variant={student.status === 'LATE' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    "flex-1 sm:flex-none h-14 sm:h-11 rounded-xl font-medium transition-all",
                    student.status === 'LATE' && "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                  )}
                  onClick={() => handleMark(student.id, 'LATE')}
                >
                  <Clock className={cn("w-5 h-5 ltr:mr-2 rtl:ml-2", student.status !== 'LATE' && "text-yellow-500")} />
                  {dict.attendance.late}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
