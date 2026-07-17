'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ROUTES_TO_PREFETCH = [
  '/dashboard/students',
  '/dashboard/attendance',
  '/dashboard/sessions',
  '/dashboard/payments',
  '/dashboard/reports',
  '/dashboard/activity',
  '/dashboard/attendance/history',
  '/dashboard/students/archived',
  '/dashboard/payments/generations',
  '/dashboard/settings',
];

export function PrefetchManager() {
  const router = useRouter();

  useEffect(() => {
    // We delay the prefetching slightly so it doesn't block the initial render/hydration
    const timeout = setTimeout(() => {
      ROUTES_TO_PREFETCH.forEach(route => {
        router.prefetch(route);
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return null;
}
