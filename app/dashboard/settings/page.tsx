import { getSettings } from '@/actions/settings';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from './settings-form';
import { getDictionary } from '@/lib/i18n';
import Link from 'next/link';
import { DatabaseBackup } from 'lucide-react';

export default async function SettingsPage() {
  const authSession = await getSession();
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const settings = await getSettings();
  const dict = await getDictionary();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dict.settingsPage?.title || 'Settings'}</h1>
        <p className="text-muted-foreground mt-1">{dict.settingsPage?.subtitle || 'Manage center details and system preferences.'}</p>
      </div>

      <SettingsForm initialSettings={settings} dict={dict} />

      <div className="border border-border/50 rounded-2xl p-4 flex items-center justify-between bg-muted/20 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-3">
          <DatabaseBackup className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="font-medium">Backup & Restore</div>
            <div className="text-sm text-muted-foreground">Download or restore your database</div>
          </div>
        </div>
        <Link
          href="/dashboard/settings/backup"
          className="text-sm text-primary hover:underline underline-offset-4"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
