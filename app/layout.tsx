import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });
const cairo = Cairo({ subsets: ['arabic'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: {
    default: 'Attendance & Center Management',
    template: '%s | Attendance System',
  },
  description: 'Production-ready Student Attendance & Center Management System with bilingual Arabic/English support.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Attendance',
  },
  robots: {
    index: false,   // Private internal tool – do not index
    follow: false,
  },
  openGraph: {
    title: 'Attendance & Center Management',
    description: 'Production-ready Student Attendance & Center Management System.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { getLocale, getDictionary } from '@/lib/i18n';
import { ThemeProvider } from '@/components/theme-provider';
import { DictionaryProvider } from '@/components/dictionary-provider';
import { ProgressProvider } from '@/components/progress-provider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const fontClass = locale === 'ar' ? cairo.className : inter.className;

  return (
    <html lang={locale} dir={dir} className="h-full antialiased" suppressHydrationWarning>
      <body className={`${fontClass} min-h-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DictionaryProvider dictionary={dictionary}>
            <ProgressProvider>
              {children}
              <Toaster position="top-center" />
            </ProgressProvider>
          </DictionaryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
