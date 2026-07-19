'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ROUTES_TO_PREFETCH = [
  '/dashboard/students',
  '/dashboard/attendance',
  '/dashboard/payments',
  '/dashboard/reports',
  '/dashboard/sessions',
  '/dashboard/activity',
];

export function PrefetchManager() {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let idleHandle: number;

    const prefetch = () => {
      ROUTES_TO_PREFETCH.forEach(route => {
        router.prefetch(route);
      });
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        idleHandle = window.requestIdleCallback(() => {
          timeoutId = setTimeout(prefetch, 1000);
        });
        return () => {
          window.cancelIdleCallback(idleHandle);
          if (timeoutId) clearTimeout(timeoutId);
        };
      } else {
        timeoutId = setTimeout(prefetch, 3000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [router]);

  return null;
}
