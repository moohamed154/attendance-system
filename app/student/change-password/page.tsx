import { getDictionary, getLocale } from '@/lib/i18n';
import { StudentChangePasswordForm } from '@/components/student/StudentChangePasswordForm';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata = {
  title: 'Change Password',
};

export default async function StudentChangePasswordPage() {
  const dict = await getDictionary();
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-card rounded-3xl border border-border/50 shadow-xl p-8">
        <StudentChangePasswordForm dict={dict} locale={locale} forced={true} />
      </div>
    </div>
  );
}
