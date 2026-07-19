'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Root global error boundary caught exception', 'GlobalErrorBoundary', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    Sentry.captureException(error, {
      tags: { boundary: 'global-error' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground flex items-center justify-center min-h-screen font-sans">
        <div className="text-center max-w-md p-6 bg-card rounded-2xl shadow-lg border border-border space-y-6">
          <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Critical Application Error</h2>
            <p className="text-muted-foreground text-sm">
              حدث خطأ فادح في النظام. يرجى المحاولة مرة أخرى.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/60 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            Retry / إعادة التشغيل
          </button>
        </div>
      </body>
    </html>
  );
}
