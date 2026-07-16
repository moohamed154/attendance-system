'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, RotateCcw } from 'lucide-react';
import { restoreStudent, hardDeleteStudent } from '@/actions/students';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDictionary } from '@/components/dictionary-provider';

export function ArchivedActions({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dict = useDictionary();
  const t = dict.archivedStudentsPage || {};

  const handleRestore = async () => {
    setIsRestoring(true);
    const result = await restoreStudent(studentId);
    if (result.success) {
      toast.success(dict.general?.success || 'Success', {
        description: (t.confirmUnarchive || '{name} has been restored.').replace('{name}', studentName),
      });
    } else {
      toast.error(dict.general?.error || 'Error', {
        description: result.error || 'Failed to restore student.',
      });
    }
    setIsRestoring(false);
  };

  const handleHardDelete = async () => {
    setIsDeleting(true);
    const result = await hardDeleteStudent(studentId);
    if (result.success) {
      toast.success(dict.general?.success || 'Deleted', {
        description: (t.confirmDelete || '{name} has been permanently deleted.').replace('{name}', studentName),
      });
    } else {
      toast.error(dict.general?.error || 'Delete Failed', {
        description: result.error || 'Failed to permanently delete student.',
      });
    }
    setIsDeleting(false);
  };

  return (
    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRestore}
        disabled={isRestoring || isDeleting}
      >
        {isRestoring ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 rtl:ml-2 ltr:mr-2" />}
        {t.confirmUnarchive?.split(' ')[1] || 'Restore'}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm"
            disabled={isRestoring || isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 rtl:ml-2 ltr:mr-2" />}
            {t.confirmDelete?.split(' ')[1] || 'Delete'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle || 'Are you absolutely sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteDesc || 'This action cannot be undone. This will permanently delete'} <b>{studentName}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.confirmDelete || 'Permanent Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
