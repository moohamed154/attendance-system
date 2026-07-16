'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { updateSession, deleteSession } from '@/actions/sessions';
import { toast } from 'sonner';

interface EditSessionButtonProps {
  session: {
    id: string;
    dayOfWeek: number;
    time: string;
    grade: string;
  };
  dict: any;
}

export function EditSessionButton({ session, dict }: EditSessionButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(dict.sessionsPage?.confirmDelete || 'Are you sure you want to delete this session?')) return;
    
    setLoading(true);
    const result = await deleteSession(session.id);
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.archived) {
        toast.success(dict.sessionsPage?.archiveSuccess || 'Session had active records, so it was archived instead of deleted.');
      } else {
        toast.success(dict.sessionsPage?.deleteSuccess || 'Session deleted successfully');
      }
      setOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string, 10);
    const time = formData.get('time') as string;
    const grade = formData.get('grade') as string;

    const result = await updateSession(session.id, { dayOfWeek, time, grade });
    
    setLoading(false);
    if (result.error) {
      toast.error(dict.sessionsPage.editError || result.error);
    } else {
      toast.success(dict.sessionsPage.editSuccess || 'Session updated successfully');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title={dict.sessionsPage.editSession}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dict.sessionsPage.editSession}</DialogTitle>
          <DialogDescription>
            {dict.sessionsPage.editSessionDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">{dict.sessionsPage.columns.day}</Label>
            <select
              id="dayOfWeek"
              name="dayOfWeek"
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={session.dayOfWeek}
            >
              <option value="0">{dict.sessionsPage.days.sunTueThu}</option>
              <option value="1">{dict.sessionsPage.days.satMonWed}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">{dict.sessionsPage.columns.time}</Label>
            <input 
              id="time" 
              name="time" 
              type="time" 
              required 
              defaultValue={
                (() => {
                  const timeStr = session.time;
                  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
                  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                  if (match) {
                    let hours = parseInt(match[1]);
                    const minutes = match[2];
                    const isPM = match[3].toUpperCase() === 'PM';
                    if (isPM && hours < 12) hours += 12;
                    if (!isPM && hours === 12) hours = 0;
                    return `${hours.toString().padStart(2, '0')}:${minutes}`;
                  }
                  return timeStr;
                })()
              }
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">{dict.sessionsPage.columns.grade}</Label>
            <select
              id="grade"
              name="grade"
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={session.grade.includes('1') ? '1' : session.grade.includes('2') ? '2' : session.grade.includes('3') ? '3' : '1'}
            >
              <option value="1">{dict.grades?.grade1 || 'Grade 1'}</option>
              <option value="2">{dict.grades?.grade2 || 'Grade 2'}</option>
              <option value="3">{dict.grades?.grade3 || 'Grade 3'}</option>
            </select>
          </div>
          <DialogFooter className="flex sm:justify-between flex-row-reverse sm:flex-row">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
              className="mr-auto"
            >
              {loading ? '...' : (dict.sessionsPage?.deleteSession || 'Delete Session')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.sessionsPage.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '...' : dict.sessionsPage.saveChanges}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
