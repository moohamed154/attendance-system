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
import { updateStudent, deleteStudent } from '@/actions/students';
import { toast } from 'sonner';
import { formatTime } from '@/lib/utils';

interface EditStudentButtonProps {
  student: {
    id: string;
    name: string;
    grade: string | null;
    studentType: string | null;
    monthlyFee: number | null;
    importMonth: string | null;
    notes: string | null;
    sessionId: string | null;
  };
  dict: any;
  sessions: { id: string; time: string; grade: string; dayOfWeek: number }[];
  timeFormat?: string;
}

export function EditStudentButton({ student, dict, sessions, timeFormat }: EditStudentButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(student.name || '');
  const [grade, setGrade] = useState(() => {
    const g = student.grade || '';
    if (g.includes('1') || g.includes('الأول') || g.includes('اول')) return '1';
    if (g.includes('2') || g.includes('الثاني') || g.includes('ثاني') || g.includes('تاني')) return '2';
    if (g.includes('3') || g.includes('الثالث') || g.includes('ثالث') || g.includes('تالت')) return '3';
    return g;
  });
  const [type, setType] = useState(student.studentType || '');
  const [price, setPrice] = useState(student.monthlyFee?.toString() || '');
  const [month, setMonth] = useState(student.importMonth || '');
  const [notes, setNotes] = useState(student.notes || '');
  const [selectedSession, setSelectedSession] = useState<string>(student.sessionId || '');

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
  };

  const handleDelete = async () => {
    if (!confirm(dict.studentsPage?.confirmDelete || 'Are you sure you want to delete this student?')) return;
    
    setLoading(true);
    const result = await deleteStudent(student.id);
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.archived) {
        toast.success(dict.studentsPage?.archiveSuccess || 'Student had active records, so they were archived instead of deleted.');
      } else {
        toast.success(dict.studentsPage?.deleteSuccess || 'Student deleted successfully');
      }
      setOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name: name.trim(),
      grade: grade.trim(),
      studentType: type.trim(),
      monthlyFee: price ? parseFloat(price) : null,
      importMonth: month.trim(),
      notes: notes.trim(),
      sessionId: selectedSession,
    };

    const res = await updateStudent(student.id, data);
    setLoading(false);

    if (res.error) {
      toast.error(dict.studentsPage.editError || 'Failed to update student');
    } else {
      toast.success(dict.studentsPage.editSuccess || 'Student updated successfully');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title={dict.studentsPage.editStudent}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      {open && (
        <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{dict.studentsPage.editStudent}</DialogTitle>
              <DialogDescription>
                {dict.studentsPage.editStudentDesc}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-start">
                  {dict.studentsPage.columns.name}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-start">
                  {dict.studentsPage.columns.grade}
                </Label>
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">{/* Leave empty as fallback if not set */}</option>
                  <option value="1">{dict.grades?.grade1 || 'Grade 1'}</option>
                  <option value="2">{dict.grades?.grade2 || 'Grade 2'}</option>
                  <option value="3">{dict.grades?.grade3 || 'Grade 3'}</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-start">
                  {dict.studentsPage.columns.type}
                </Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">--</option>
                  <option value="Male">{dict.studentsPage?.gender?.male || 'Male'}</option>
                  <option value="Female">{dict.studentsPage?.gender?.female || 'Female'}</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-start">
                  {dict.studentsPage.columns.price}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="month" className="text-start">
                  {dict.studentsPage.columns.month}
                </Label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">--</option>
                  {Object.entries(dict.paymentsPage?.months || {}).map(([num, name]: [string, any]) => (
                    <option key={num} value={num}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-start">
                  {dict.studentsPage.columns.notes}
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label>{dict.studentsPage.columns.sessions}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-[150px] overflow-y-auto pr-2">
                  {sessions.map((session) => (
                    <label key={session.id} className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <input 
                        type="radio" 
                        name="session" 
                        value={session.id} 
                        checked={selectedSession === session.id}
                        onChange={() => handleSessionChange(session.id)}
                        className="rounded-full border-gray-300" 
                        required
                      />
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
            </div>
            <DialogFooter className="flex sm:justify-between flex-row-reverse sm:flex-row mt-6">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={loading}
                className="mr-auto"
              >
                {loading ? '...' : (dict.studentsPage?.deleteStudent || 'Delete Student')}
              </Button>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {dict.studentsPage.cancel || 'Cancel'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '...' : (dict.studentsPage.saveChanges || 'Save Changes')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
