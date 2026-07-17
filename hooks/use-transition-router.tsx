'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function useTransitionRouter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = (href: string, options?: any) => {
    startTransition(() => {
      router.push(href, options);
    });
  };

  const replace = (href: string, options?: any) => {
    startTransition(() => {
      router.replace(href, options);
    });
  };

  return { ...router, push, replace, isPending };
}
