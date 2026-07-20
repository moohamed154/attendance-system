'use client';

import NextTopLoader from 'nextjs-toploader';

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NextTopLoader
        color="#2563eb"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
      />
    </>
  );
}
