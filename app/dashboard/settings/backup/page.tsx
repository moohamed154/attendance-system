'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, ShieldAlert, DatabaseBackup, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useDictionary } from '@/components/dictionary-provider';

export default function BackupPage() {
  const dict = useDictionary();
  const t = dict.backupPage || {};
  
  const [restoring, setRestoring] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    window.open('/api/backup/download', '_blank');
  };

  const handleRestore = async (file: File) => {
    if (!file.name.endsWith('.db')) {
      toast.error(t.fileFormatError || 'Please select a valid .db backup file.');
      return;
    }

    if (!confirm(t.restoreWarning || 'This will OVERWRITE your current database with the backup. Are you absolutely sure?')) return;

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || t.restoreSuccess || 'Database restored! You may need to refresh.');
      }
    } catch (error) {
      toast.error(t.restoreError || 'Failed to upload restore file.');
    } finally {
      setRestoring(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleRestore(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
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
              {t.downloadBackupDesc || 'Downloads the complete SQLite database file including all students, attendance records, sessions, and payments.'}
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
        <Card className="border-destructive/30 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle>{t.restoreBackup || 'Restore Backup'}</CardTitle>
                <CardDescription>{t.restoreBackupDesc || 'Restore from a .db file'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{t.restoreWarning || 'This will overwrite your current data'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.restoreBackupDesc || 'Upload a previously downloaded .db file. The current database is automatically backed up before restoring.'}
            </p>

            <div
              className={\order-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer \\}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {dragOver ? (dict.general?.dropHere || 'Drop the file here') : (t.selectFile || 'Drag & drop or click to select a .db file')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <Button
              variant="destructive"
              className="w-full gap-2"
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
            {t.restoreImportant || 'Important: After restoring a backup, the server may need to be restarted for changes to take effect. A copy of your pre-restore database is automatically saved in prisma/dev.db.bak-*.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
