import { getSettings } from '@/actions/settings/settings';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/settings-form';
import { getDictionary, getLocale } from '@/lib/i18n';
import Link from 'next/link';
import { DatabaseBackup } from 'lucide-react';

export default async function SettingsPage() {
  const authSession = await getSession();
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const settings = await getSettings();
  const dict = await getDictionary();
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <div className="space-y-6 max-w-4xl" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? 'الإعدادات وتفضيلات النظام' : (dict.settingsPage?.title || 'Settings')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? 'إدارة تفاصيل المركز التعليمي، خيارات الحجز والأسعار، وعمليات تهيئة البيانات.'
            : (dict.settingsPage?.subtitle || 'Manage center details and system preferences.')}
        </p>
      </div>

      <SettingsForm initialSettings={settings} dict={dict} locale={locale} />

      <div className="border border-border/50 rounded-2xl p-5 flex items-center justify-between bg-muted/20 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-3">
          <DatabaseBackup className="w-5 h-5 text-primary" />
          <div>
            <div className="font-semibold text-sm">
              {isAr ? 'النسخ الاحتياطي واستعادة البيانات' : 'Backup & Restore'}
            </div>
            <div className="text-xs text-muted-foreground">
              {isAr ? 'تحميل نسخة احتياطية من القاعدة أو رفع وتفريغ نسخة سابقة' : 'Download or restore your database'}
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/settings/backup"
          className="text-xs font-semibold text-primary hover:underline underline-offset-4"
        >
          {isAr ? 'فتح صفحة النسخ الاحتياطي ←' : 'Open →'}
        </Link>
      </div>
    </div>
  );
}
