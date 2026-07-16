import { LoginForm } from '@/components/login-form';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { getDictionary, getLocale } from '@/lib/i18n';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';

export default async function LoginPage() {
  const session = await getSession();
  const dict = await getDictionary();
  const locale = await getLocale();
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle currentLocale={locale} />
      </div>
      <div className="w-full max-w-md">
        <LoginForm dict={dict} />
      </div>
    </div>
  );
}
