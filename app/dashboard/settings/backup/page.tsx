'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, ShieldAlert, DatabaseBackup, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useDictionary } from '@/components/shared/dictionary-provider';

export default function BackupPage() {
  const dict = useDictionary();
  const t = dict.backupPage || {};
  
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    window.open('/api/backup/download', '_blank');
  };

  const handleRestore = async (file: File) => {
    if (!file.name.endsWith('.gz')) {
      toast.error(t.fileFormatError || 'Please select a valid .json.gz backup file.');
      return;
    }

    if (!confirm(t.restoreWarning || 'This will OVERWRITE your current database with the backup. Are you absolutely sure?')) return;

    setRestoring(true);

    const promise = new Promise<string>(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to restore');
        }

        resolve(t.restoreSuccess || 'Database restored successfully.');
      } catch (err: any) {
        reject(err);
      } finally {
        setRestoring(false);
      }
    });

    toast.promise(promise, {
      loading: t.restoring || 'Restoring database...',
      success: (msg: any) => msg,
      error: (err: any) => err.message || t.restoreError || 'Failed to upload restore file.',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleRestore(file);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.pageTitle || 'Backup & Restore'}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle || 'Download a copy of your database or restore from a previous backup.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Download Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <DatabaseBackup className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t.downloadBackup || 'Download Backup'}</CardTitle>
                <CardDescription>{t.downloadBackupDesc || 'Export your current database'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.downloadBackupDesc || 'Downloads the complete database backup containing all students, attendance records, sessions, and payments.'}
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              {dict.general?.safe || 'Safe — read-only, no data is modified'}
            </div>
            <Button onClick={handleDownload} className="w-full gap-2">
              <Download className="w-4 h-4" />
              {t.downloadBackup || 'Download Database Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>{t.restoreBackup || 'Restore Backup'}</CardTitle>
                <CardDescription>{t.restoreBackupDesc || 'Restore database from backup'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.restoreBackupDesc || 'Select a previously downloaded backup file (.json.gz) to restore your system data.'}
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {t.restoreWarning || 'Warning: Restoring will overwrite all existing database data.'}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".gz"
              className="hidden"
            />
            <Button
              className="w-full gap-2 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
            >
              <ShieldAlert className="w-4 h-4" />
              {restoring ? (t.restoring || 'Restoring...') : (t.selectFile || 'Select File to Restore')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            {t.restoreImportant || 'Important: Restoring a backup overwrites all current database data. This operation cannot be undone. Backups are applied instantly.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
