import { MetadataRoute } from 'next';
import { getCenterSettings } from '@/actions/settings/settings';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const centerSettings = await getCenterSettings();
  const name = centerSettings.centerName;
  const description = centerSettings.centerDescription || `${name} Student Attendance & Center Management System`;
  const logo = centerSettings.centerLogo || '/default-logo.svg';

  return {
    name,
    short_name: name,
    description,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    lang: 'ar',
    dir: 'rtl',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: logo,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: logo,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    prefer_related_applications: false,
  };
}
