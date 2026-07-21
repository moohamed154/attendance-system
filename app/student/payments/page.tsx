import { getDictionary, getLocale } from '@/lib/i18n';
import { getStudentSession } from '@/lib/student-auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ChevronLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'My Payments',
};

export default async function StudentPaymentsPage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  const dict = await getDictionary();
  const locale = await getLocale();
  const t = (dict as any).studentAuth?.payments || {};
  const isRtl = locale === 'ar';
  const currency = dict.general?.currency || 'EGP';

  const student = await prisma.student.findUnique({
    where: { id: session.studentDbId },
    include: {
      payments: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      },
    },
  });

  if (!student) redirect('/student/login');

  const monthNames = isRtl
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const statusColor = {
    PAID: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    UNPAID: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    PARTIAL: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  };

  const statusLabel = {
    PAID: (dict as any).studentAuth?.dashboard?.paid || 'Paid',
    UNPAID: (dict as any).studentAuth?.dashboard?.unpaid || 'Unpaid',
    PARTIAL: (dict as any).studentAuth?.dashboard?.partial || 'Partial',
  };

  return (
    <div className={cn("min-h-screen bg-background", isRtl && "text-right")} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted/50 transition-colors shrink-0"
          >
            <ChevronLeft className={cn("w-4 h-4", isRtl && "rotate-180")} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{t.title || 'My Payments'}</h1>
        </div>

        {/* Records */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {student.payments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {t.noRecords || 'No payment records found'}
            </div>
          ) : (
            <div className="divide-y divide-border/50" data-testid="portal-payments-list">
              {student.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {monthNames[payment.month - 1]} {payment.year}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.amountPaid || 0} / {payment.amount} {currency}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                    statusColor[payment.status as keyof typeof statusColor] || statusColor.UNPAID
                  )}>
                    {statusLabel[payment.status as keyof typeof statusLabel] || payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
