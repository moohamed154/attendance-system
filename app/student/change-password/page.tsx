import { getDictionary, getLocale } from '@/lib/i18n';
import { StudentChangePasswordForm } from '@/components/student/StudentChangePasswordForm';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { studentLogoutAction } from '@/actions/student-auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
export const metadata = {
  title: 'Change Password',
};

export default async function StudentChangePasswordPage() {
  const dict = await getDictionary();
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 rtl:left-4 rtl:right-auto">
        <LanguageToggle currentLocale={locale} />
        <ThemeToggle />
        <form action={studentLogoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title={dict.studentAuth?.dashboard?.logout || 'Logout'}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </form>
      </div>
      <div className="w-full max-w-md bg-card rounded-3xl border border-border/50 shadow-xl p-8 z-10 mt-16 md:mt-0">
        <StudentChangePasswordForm dict={dict} locale={locale} forced={true} />
      </div>
    </div>
  );
}
