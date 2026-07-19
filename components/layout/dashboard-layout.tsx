'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarDays, CreditCard, BarChart3, Settings, LogOut, FileSpreadsheet, Clock, UserCog, ClipboardCheck, Activity, History, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useDictionary } from '@/components/dictionary-provider';
import { GlobalSearch } from '@/components/global-search';

export function DashboardLayout({ children, role, locale }: { children: React.ReactNode, role: string, locale: string }) {
  const dict = useDictionary();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <DesktopSidebar role={role} locale={locale} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
          <h2 className="text-xl font-bold text-primary">{dict.nav.attendance}</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle currentLocale={locale} />
          </div>
        </div>

        {/* Desktop Header / Global Search */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
          <GlobalSearch dict={dict} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageToggle currentLocale={locale} />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 p-4 md:p-8 relative">
          {children}
        </main>
        <MobileBottomNav role={role} />
      </div>
    </div>
  );
}

function DesktopSidebar({ role, locale }: { role: string, locale: string }) {
  const pathname = usePathname();
  const dict = useDictionary();
  
  const adminNav = [
    { name: dict.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: dict.nav.students, href: '/dashboard/students', icon: Users },
    { name: dict.nav.sessions, href: '/dashboard/sessions', icon: Clock },
    { name: dict.nav.attendance, href: '/dashboard/attendance', icon: ClipboardCheck },
    { name: dict.nav.history, href: '/dashboard/attendance/history', icon: History },
    { name: dict.nav.import, href: '/dashboard/import', icon: FileSpreadsheet },
    { name: dict.nav.payments, href: '/dashboard/payments', icon: CreditCard },
    { name: dict.nav.reports, href: '/dashboard/reports', icon: BarChart3 },
    { name: dict.nav.activity, href: '/dashboard/activity', icon: Activity },
    { name: dict.nav.users, href: '/dashboard/users', icon: UserCog },
    { name: dict.nav.settings, href: '/dashboard/settings', icon: Settings },
    { name: locale === 'ar' ? 'حالة النظام' : 'System Health', href: '/dashboard/system', icon: Cpu },
  ];

  const assistantNav = [
    { name: dict.nav.today, href: '/dashboard', icon: CalendarDays },
    { name: dict.nav.students, href: '/dashboard/students', icon: Users },
    { name: dict.nav.attendance, href: '/dashboard/attendance', icon: ClipboardCheck },
    { name: dict.nav.history, href: '/dashboard/attendance/history', icon: History },
  ];

  const nav = role === 'ADMIN' ? adminNav : assistantNav;

  return (
    <div className="hidden md:flex flex-col w-64 bg-background border-e">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-primary">{dict.nav.attendance}</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t space-y-4">
        <form action={logoutAction}>
          <Button variant="ghost" className="w-full justify-start text-destructive" type="submit">
            <LogOut className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {dict.nav.logout}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MobileBottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const dict = useDictionary();
  
  const adminNav = [
    { name: dict.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: dict.nav.students, href: '/dashboard/students', icon: Users },
    { name: dict.nav.sessions, href: '/dashboard/sessions', icon: Clock },
    { name: dict.nav.import, href: '/dashboard/import', icon: FileSpreadsheet },
    { name: dict.nav.activity, href: '/dashboard/activity', icon: Activity },
    { name: dict.nav.users, href: '/dashboard/users', icon: UserCog },
    { name: dict.nav.settings, href: '/dashboard/settings', icon: Settings },
  ];

  const assistantNav = [
    { name: dict.nav.today, href: '/dashboard', icon: CalendarDays },
    { name: dict.nav.students, href: '/dashboard/students', icon: Users },
    { name: dict.nav.attendance, href: '/dashboard/attendance', icon: ClipboardCheck },
  ];

  const nav = role === 'ADMIN' ? adminNav : assistantNav;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-lg pb-safe">
      <nav className="flex justify-around items-center p-2">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-start p-1.5 rounded-xl transition-all min-w-0 flex-1 gap-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "fill-primary/20")} />
              <span className="text-[9px] font-medium text-center line-clamp-1 w-full px-0.5">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
}
