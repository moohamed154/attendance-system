'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
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
import { Session } from '@prisma/client';
import { createStudent } from '@/actions/students/students';
import { toast } from 'sonner';
import { formatTime } from '@/lib/utils';
import { cleanEgyptianPhoneInput } from '@/lib/validations';

export function AddStudentButton({ sessions, dict, timeFormat }: { sessions: Session[], dict: any, timeFormat?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = dict.modals || {};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const studentId = formData.get('studentId') as string;
    const studentPhone = formData.get('studentPhone') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const studentType = formData.get('studentType') as string;
    const grade = formData.get('grade') as string;
    const sessionId = formData.get('session') as string;
    const monthlyFeeStr = formData.get('monthlyFee') as string;
    const monthlyFee = monthlyFeeStr ? parseFloat(monthlyFeeStr) : null;
    const importMonth = formData.get('importMonth') as string;
    const notes = formData.get('notes') as string;

    const result = await createStudent({ 
      studentId, name, studentPhone, parentPhone, grade, sessionId, 
      studentType, monthlyFee, importMonth, notes 
    });
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict.general?.success || 'Student added successfully');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl" data-testid="add-student-button">
          <Plus className="w-4 h-4 rtl:ml-2 ltr:mr-2" />
          {dict?.studentsPage?.addStudent || 'Add Student'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.addStudentTitle || 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {t.addStudentDesc || 'Enter the details of the new student and assign them to sessions.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.fullName || 'Full Name'}</Label>
            <Input id="name" name="name" required placeholder={dict.general?.eg || 'e.g.'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentId">{t.studentId || 'Student ID (Excel ID)'}</Label>
            <Input id="studentId" name="studentId" required placeholder="STU-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentPhone">{dict.studentsPage?.columns?.studentPhone || 'Student Phone'}</Label>
            <Input 
              id="studentPhone" 
              name="studentPhone" 
              required 
              type="tel" 
              inputMode="numeric" 
              maxLength={11} 
              pattern="^(010|011|012|015)[0-9]{8}$" 
              title="Must be a valid 11-digit Egyptian mobile number" 
              placeholder="010..." 
              onChange={(e) => {
                e.target.value = cleanEgyptianPhoneInput(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentPhone">{dict.studentsPage?.columns?.parentPhone || 'Parent Phone'} ({dict.general?.optional || 'Optional'})</Label>
            <Input 
              id="parentPhone" 
              name="parentPhone" 
              type="tel" 
              inputMode="numeric" 
              maxLength={11} 
              pattern="^(010|011|012|015)[0-9]{8}$" 
              title="Must be a valid 11-digit Egyptian mobile number" 
              placeholder="010..." 
              onChange={(e) => {
                e.target.value = cleanEgyptianPhoneInput(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentType">{dict.studentsPage?.columns?.type || 'Gender'}</Label>
            <select
              id="studentType"
              name="studentType"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue="Male"
            >
              <option value="Male">{dict.studentsPage?.gender?.male || 'Male'}</option>
              <option value="Female">{dict.studentsPage?.gender?.female || 'Female'}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">{dict.studentsPage?.columns?.grade || 'Grade'}</Label>
            <select
              id="grade"
              name="grade"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue="1"
            >
              <option value="1">{dict.grades?.grade1 || 'Grade 1'}</option>
              <option value="2">{dict.grades?.grade2 || 'Grade 2'}</option>
              <option value="3">{dict.grades?.grade3 || 'Grade 3'}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyFee">{dict.studentsPage?.columns?.price || 'Monthly Fee'}</Label>
            <Input id="monthlyFee" name="monthlyFee" type="number" step="0.01" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="importMonth">{dict.studentsPage?.columns?.month || 'Month'}</Label>
            <select
              id="importMonth"
              name="importMonth"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue=""
            >
              <option value="">--</option>
              {Object.entries(dict.paymentsPage?.months || {}).map(([num, name]: [string, any]) => (
                <option key={num} value={num}>{name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{dict.studentsPage?.columns?.notes || 'Notes'}</Label>
            <Input id="notes" name="notes" />
          </div>
          <div className="space-y-2">
            <Label>{dict.studentsPage?.columns?.sessions || 'Sessions'}</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {sessions.map((session) => (
                <label key={session.id} className="flex items-center rtl:space-x-reverse space-x-2 border p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="session" value={session.id} required className="rounded-full border-gray-300" />
                  <div className="text-sm">
                    <div className="font-medium">
                      {session.dayOfWeek === 0 ? dict.sessionsPage?.days?.sunTueThu || 'Sun/Tue/Thu' : dict.sessionsPage?.days?.satMonWed || 'Sat/Mon/Wed'} - {formatTime(session.time, timeFormat || '12h')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.grade === '1' ? dict.grades?.grade1 : 
                       session.grade === '2' ? dict.grades?.grade2 : 
                       session.grade === '3' ? dict.grades?.grade3 : session.grade}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full rounded-xl mt-4" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : null}
            {loading ? (dict.loadingStates?.saving || 'Saving...') : (dict.general?.saveChanges || 'Save Student')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
