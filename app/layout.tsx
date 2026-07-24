import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getCenterSettings } from '@/actions/settings/settings';
import { getLocale, getDictionary } from '@/lib/i18n';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { DictionaryProvider } from '@/components/shared/dictionary-provider';
import { CenterSettingsProvider } from '@/components/shared/center-settings-provider';
import { ProgressProvider } from '@/components/shared/progress-provider';

const inter = Inter({ subsets: ['latin'] });
const cairo = Cairo({ subsets: ['arabic'], weight: ['400', '500', '600', '700'] });

export async function generateMetadata(): Promise<Metadata> {
  const centerSettings = await getCenterSettings();
  const titleName = centerSettings.centerName;
  const desc = centerSettings.centerDescription || `${titleName} Management & Reservation System`;
  const logo = centerSettings.centerLogo || '/default-logo.svg';
  const icon = centerSettings.favicon || logo;

  return {
    title: {
      default: titleName,
      template: `%s | ${titleName}`,
    },
    description: desc,
    manifest: '/manifest.json',
    icons: {
      icon: icon,
      apple: icon,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: titleName,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: titleName,
      description: desc,
      type: 'website',
      images: logo ? [{ url: logo }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleName,
      description: desc,
      images: logo ? [logo] : [],
    },
  };
}

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const centerSettings = await getCenterSettings();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const fontClass = locale === 'ar' ? cairo.className : inter.className;

  return (
    <html lang={locale} dir={dir} className="h-full antialiased" suppressHydrationWarning>
      <body className={`${fontClass} min-h-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DictionaryProvider dictionary={dictionary}>
            <CenterSettingsProvider settings={centerSettings}>
              <ProgressProvider>
                {children}
                <Toaster position="top-center" />
                <Analytics />
                <SpeedInsights />
              </ProgressProvider>
            </CenterSettingsProvider>
          </DictionaryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
