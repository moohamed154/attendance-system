import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ImportManager } from '@/components/excel-import/import-manager';
import { getDictionary } from '@/lib/i18n';

export const metadata = {
  title: 'Import Students - Attendance System',
};

export default async function ImportPage() {
  const authSession = await getSession();
  const dict = await getDictionary();
  const t = dict.importPage || {};
  
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.pageTitle || 'Bulk Import'}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle || 'Import students and assign them to sessions using an Excel file.'}</p>
      </div>

      <ImportManager />
    </div>
  );
}
