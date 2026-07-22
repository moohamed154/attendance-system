import React from 'react';
import { getLocale } from '@/lib/i18n';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageToggle } from '@/components/shared/language-toggle';
import Link from 'next/link';
import { BookOpen, Search, Sparkles } from 'lucide-react';

export default async function PublicReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
      {/* Top Header with Dark Mode & Language Toggles */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/reserve" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">
                {isAr ? 'بوابة الحجز الإلكتروني' : 'Public Reservation Portal'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'مركز التفوق التعليمي' : 'Excellence Educational Center'}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs sm:text-sm font-medium">
              <Link
                href="/reserve"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-background transition-colors text-foreground"
              >
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{isAr ? 'حجز جديد' : 'New Reservation'}</span>
              </Link>
              <Link
                href="/reserve/my"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-background transition-colors text-foreground"
              >
                <Search className="w-4 h-4 text-primary" />
                <span>{isAr ? 'استعلام' : 'Lookup'}</span>
              </Link>
            </nav>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LanguageToggle currentLocale={locale} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-muted/10">
        <p>© {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة - نظام إدارة الحضور والتحفيظ' : 'All rights reserved - Attendance & Center Management'}</p>
      </footer>
    </div>
  );
}
