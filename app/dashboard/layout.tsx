import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLocale } from '@/lib/i18n';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const locale = await getLocale();

  return (
    <DashboardLayout role={session.role as string} locale={locale}>
      {children}
    </DashboardLayout>
  );
}
