import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewMonthWizard } from '@/components/payments/new-month-wizard';

export const metadata = {
  title: 'Start New Month',
};

export default async function NewMonthPage() {
  const session = await getSession();

  if (session?.role !== 'ADMIN') {
    redirect('/dashboard/payments');
  }

  return (
    <div className="space-y-6">
      <NewMonthWizard />
    </div>
  );
}
