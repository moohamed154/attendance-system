'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSession } from '@/actions/sessions';
import { toast } from 'sonner';

export function AddSessionButton({ dict }: { dict: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string);
    const time = formData.get('time') as string;
    const grade = formData.get('grade') as string;

    const result = await createSession({ dayOfWeek, time, grade });
    
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(dict.general?.success || 'Session created successfully');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          {dict.sessionsPage.addSession}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dict.sessionsPage.addSession}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">{dict.sessionsPage.columns.day}</Label>
            <select 
              id="dayOfWeek" 
              name="dayOfWeek" 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">{dict.sessionsPage.columns.grade}</Label>
            <select
              id="grade"
              name="grade"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue="1"
            >
              <option value="1">{dict.grades.grade1}</option>
              <option value="2">{dict.grades.grade2}</option>
              <option value="3">{dict.grades.grade3}</option>
            </select>
          </div>
          <Button type="submit" className="w-full rounded-xl mt-4" disabled={loading}>
            {loading ? '...' : dict.sessionsPage.addSession}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
