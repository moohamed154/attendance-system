import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ImportManager } from '@/components/excel-import/import-manager';

export const metadata = {
  title: 'Import Students - Attendance System',
};

export default async function ImportPage() {
  const authSession = await getSession();
  
  if (authSession?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
        <p className="text-muted-foreground mt-1">Import students and assign them to sessions using an Excel file.</p>
      </div>

      <ImportManager />
    </div>
  );
}
