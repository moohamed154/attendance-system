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

export function ArchivedActions({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    const result = await restoreStudent(studentId);
    if (result.success) {
      toast.success('Success', {
        description: `${studentName} has been restored.`,
      });
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to restore student.',
      });
    }
    setIsRestoring(false);
  };

  const handleHardDelete = async () => {
    setIsDeleting(true);
    const result = await hardDeleteStudent(studentId);
    if (result.success) {
      toast.success('Deleted', {
        description: `${studentName} has been permanently deleted.`,
      });
    } else {
      toast.error('Delete Failed', {
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
        {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
        Restore
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm"
            disabled={isRestoring || isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <b>{studentName}</b> from the database.
              If this student has any attendance history, the system will block the deletion to preserve history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Permanent Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
