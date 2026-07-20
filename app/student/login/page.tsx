import { getDictionary, getLocale } from '@/lib/i18n';
import { StudentLoginForm } from '@/components/student/StudentLoginForm';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageToggle } from '@/components/shared/language-toggle';

export const metadata = {
  title: 'Student Portal Login',
};

export default async function StudentLoginPage() {
  const dict = await getDictionary();
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle currentLocale={locale} />
      </div>
      <div className="w-full max-w-md bg-card rounded-3xl border border-border/50 shadow-xl p-8">
        <StudentLoginForm dict={dict} locale={locale} />
      </div>
    </div>
  );
}
